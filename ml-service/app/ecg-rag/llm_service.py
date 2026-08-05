from groq import Groq
import re
from config import MODEL_NAME, GROQ_API_KEY



def generate_diagnosis(features, retrieved_texts, user_query, medical_history = None):
    # Limit the length of `retrieved_texts` to avoid exceeding the API limit
    # max_length = 6000  # Adjust as needed
    retrieved_texts_str = str(retrieved_texts)

    print(features)
    print("\n")
    print(retrieved_texts_str)
        

    prompt = f"""

    \n\n  User Query: {user_query}
    \n\n ECG Features: {features}

    \n\n Relevant Cases: {retrieved_texts_str}

    \n\n Medical History: {medical_history}


 

    Visit the user query and encorporate it when answering the rest of the questions

    \n\n

    Please respond in a structured tabular format:
    

    | Condition | Result (True/False) | Explanation |
    |-----------|---------------------|-------------|
    | MI (Myocardial Infarction) | True/False | Explanation... |
    | CD (Cardiac Disease) | True/False | Explanation... |
    | HYP (Hypertension) | True/False | Explanation... |
    | STTC (ST-T Changes) | True/False | Explanation... |
    | Other | True/False | Explanation... |
    
    \n\n What is the most likely diagnosis?
    """
    
    try:
        groq = Groq(api_key= GROQ_API_KEY)
        
        chat_completion= groq.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL_NAME
        )
        
        return chat_completion.choices[0].message.content


    except Exception as e:
        error_message = str(e)
        if "rate_limit_exceeded" in error_message:
            return {"status": "error", "message": "Rate limit exceeded. Please try again later."}
        elif "Limit 100000" in error_message:
            return {"status": "error", "message": "Message size exceeded. Please reduce input size."}
        else:
            return {"status": "error", "message": f"Unexpected error: {error_message}"}
