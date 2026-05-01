"""
S — Single responsibility: AI-powered report generation and chat only.
"""
import re

from config import GROQ_API_KEY, GROQ_MODEL


def _strip_think(text: str) -> str:
    """Remove Qwen3 <think>…</think> reasoning blocks."""
    return re.sub(r"<think>.*?</think>\s*", "", text, flags=re.DOTALL).strip()


def _call_groq(messages: list[dict], temperature: float, max_tokens: int) -> str:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    resp   = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return _strip_think(resp.choices[0].message.content)


def _analysis_context(ad: dict) -> str:
    return (
        f"- Ejection Fraction (EF): {ad.get('ef','?')}%  |  Classification: {ad.get('label','?')}\n"
        f"- End-Systole (ES): frame #{ad.get('es_frame','?')},"
        f" LV area = {ad.get('es_area','?')} px2\n"
        f"- End-Diastole (ED): frame #{ad.get('ed_frame','?')},"
        f" LV area = {ad.get('ed_area','?')} px2\n"
        f"- Total frames: {ad.get('total_frames','?')}"
    )


def generate_report(analysis_data: dict) -> str:
    """Generate a focused echo findings report with case-specific recommendations."""
    sc     = len(analysis_data.get("chart_data", {}).get("systole_frames", []))
    ef     = analysis_data.get("ef", "?")
    label  = analysis_data.get("label", "?")
    es_a   = analysis_data.get("es_area", "?")
    ed_a   = analysis_data.get("ed_area", "?")
    es_f   = analysis_data.get("es_frame", "?")
    ed_f   = analysis_data.get("ed_frame", "?")
    tf     = analysis_data.get("total_frames", "?")

    fac = (
        round((int(ed_a) - int(es_a)) / max(int(ed_a), 1) * 100, 1)
        if str(ed_a).isdigit() and str(es_a).isdigit()
        else "N/A"
    )

    prompt = f"""You are a specialist cardiologist writing a formal echocardiogram findings report.
Focus strictly on what the echo data shows. Do not include any patient demographics.

--- AI-EXTRACTED ECHO MEASUREMENTS ---
- Ejection Fraction (EF)      : {ef}%  ->  {label}
- LV End-Systolic Area (ESA)  : {es_a} px2  (frame {es_f})
- LV End-Diastolic Area (EDA) : {ed_a} px2  (frame {ed_f})
- Fractional Area Change (FAC): {fac}%
- Cardiac cycles analyzed     : {sc}
- Total video frames          : {tf}
---------------------------------------

Write a structured report in English with exactly these sections:

1. ECHO FINDINGS
   Describe LV size, wall motion, and inferred valve function based on the measurements.

2. SYSTOLIC FUNCTION ASSESSMENT
   Interpret EF and FAC against normal reference values (EF >= 55%, FAC >= 35%).
   State the degree of dysfunction if present.

3. PRELIMINARY IMPRESSION
   Based solely on these values, state the most likely diagnosis
   (e.g. mild systolic dysfunction, dilated cardiomyopathy, etc.).

4. RECOMMENDED MEDICATIONS
   List guideline-directed medications for this specific EF level per ESC/ACC guidelines.
   Include drug class and generic name. Do not include specific doses.

5. RECOMMENDED INVESTIGATIONS
   List only the investigations this case specifically warrants, with a brief reason for each:
   - Imaging (cardiac MRI, CT, coronary angiography?)
   - Targeted blood tests
   - Functional tests (stress echo, stress ECG?)

6. FOLLOW-UP RECOMMENDATION
   When should echo be repeated? What findings would indicate urgent escalation?

[NOTE] This is an AI-assisted preliminary report. Final clinical decisions rest with the treating physician."""

    return _call_groq(
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=2500,
    )


def chat(user_message: str, analysis_data: dict, history: list[dict]) -> str:
    """Handle a single chat turn with full conversation context."""
    system = f"""You are an expert cardiology assistant. You have the following echocardiogram analysis results:
{_analysis_context(analysis_data)}

Answer clearly and professionally. If the findings raise clinical concerns, be direct about the risks
and recommended actions. Do not output any internal reasoning text."""

    messages = [{"role": "system", "content": system}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    return _call_groq(messages=messages, temperature=0.4, max_tokens=1500)
