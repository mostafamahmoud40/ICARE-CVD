import os
import json
import re
from groq import Groq

class MedicalAnalyzer:
    def __init__(self, api_key: str = None):
        self.client = Groq(api_key=api_key or os.environ.get("GROQ_API_KEY"))

    def analyze(self, markdown_text: str) -> str:
        prompt = f"""You are a smart medical assistant. You have been given text extracted from a medical lab report using OCR.
You must analyze the text and return the result as a JSON object strictly matching the following schema. Do NOT include any additional text outside the JSON.

```json
{{
  "facility": {{
    "hospital_name": "Hospital name if found, else empty",
    "lab_name": "Lab name if found, else empty",
    "doctor_name": "Doctor name if found, else empty"
  }},
  "patient": {{
    "id": "Patient ID or identifier",
    "date_collected": "Date sample collected",
    "date_reported": "Date reported"
  }},
  "results": [
    {{
      "test_name": "Name of the test",
      "value": "Value",
      "unit": "Unit",
      "reference_range": "Reference range",
      "status": "Normal|High|Low|Critical"
    }}
  ],
  "summary": "Medical summary and notes written in ENGLISH based on any abnormal results."
}}
```

Note for the 'status' column: You MUST strictly use one of these four English words: Normal, High, Low, or Critical. If a reference range is missing, use your medical knowledge.

Raw Extracted Text:
{markdown_text}
"""

        completion = self.client.chat.completions.create(
            model="qwen/qwen3-32b", 
            messages=[
              {
                "role": "user",
                "content": prompt
              }
            ],
            temperature=0.1,
            max_completion_tokens=4096,
            top_p=0.95,
            stream=False,
            response_format={"type": "json_object"}
        )

        content = completion.choices[0].message.content
        
        # Print raw content for debugging in the backend console
        print("RAW LLM OUTPUT:", content)
        
        # Remove <think> blocks if any
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
        
        # Robust JSON extraction: find the first { and the last }
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            content = match.group(0)
            
        return content

    def chat_with_context(self, history: list, report_context: dict) -> str:
        system_prompt = f"""You are a smart doctor and personal medical assistant.
You have the following data from a patient's medical lab report:
{json.dumps(report_context, ensure_ascii=False, indent=2)}

CRITICAL LANGUAGE RULES - YOU MUST FOLLOW THESE:
1. ALWAYS respond in ENGLISH. NO EXCEPTIONS unless the user writes in Arabic script.
2. ONLY if the user's message contains Arabic words/letters (e.g., "مرحبا", "كيف", "شكرا"), then reply in Arabic.
3. For ALL English questions, greetings, or any text using Latin letters: respond ONLY in ENGLISH.
4. Examples:
   - User: "hello" → Reply in ENGLISH
   - User: "what is this" → Reply in ENGLISH  
   - User: "مرحبا" → Reply in Arabic
   - User: "what is my report" → Reply in ENGLISH (even if report data contains Arabic text)
5. Report data may contain Arabic text, but you must still respond in ENGLISH unless the user's query is in Arabic.

Other instructions:
- If the user's question is about the report, answer accurately and professionally.
- If the user asks a general question, answer naturally and briefly.
- If the user asks about something not in the report, politely say it's not covered.
- Start your answer directly without labels like "Summary:" or "Answer:".

Use the overall context to better understand the patient."""

        messages = [{"role": "system", "content": system_prompt}]
        
        # Append conversation history
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})

        completion = self.client.chat.completions.create(
            model="qwen/qwen3-32b", 
            messages=messages,
            temperature=0.4,
            max_completion_tokens=2048,
            top_p=0.95,
            stream=False
        )

        content = completion.choices[0].message.content
        
        # Remove <think> blocks if any
        content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
        
        return content
