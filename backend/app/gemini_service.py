import os
import base64
from typing import List, Optional
from pydantic import BaseModel
from google import genai
from google.genai import types

# Vision triage result Pydantic schema for structured output
class VisionTriageResult(BaseModel):
    detected_category: str
    detected_description: str
    confidence_score: float
    severity_score: int  # 1 to 10
    suggested_tags: List[str]

# Fallback answers for robust offline demo capability
FALLBACK_ANSWERS = {
    "hi": {
        "birth certificate": "जन्म प्रमाणपत्र प्राप्त करने के लिए चरण:\n1. स्थानीय नगर निगम कार्यालय या आधिकारिक राज्य पोर्टल पर जाएं।\n2. आवेदन पत्र संख्या 1 भरें।\n3. जन्म का प्रमाण (अस्पताल रिकॉर्ड) और माता-पिता के पहचान पत्र संलग्न करें।\n4. लागू शुल्क का भुगतान करें।\n5. सत्यापन के बाद, प्रमाणपत्र 7-15 दिनों में जारी किया जाएगा।",
        "pm awas yojana": "प्रधानमंत्री आवास योजना (PMAY) के लिए आवश्यक दस्तावेज:\n- पहचान पत्र (आधार कार्ड, मतदाता पहचान पत्र)\n- पता प्रमाण\n- आय प्रमाण पत्र (Income Certificate)\n- बैंक खाता विवरण\n- हलफनामा कि लाभार्थी के पास पक्का घर नहीं है।",
        "street light": "टूटी हुई स्ट्रीट लाइट की रिपोर्ट करने के लिए:\n1. हमारे पोर्टल पर 'समस्या की रिपोर्ट करें' अनुभाग पर जाएं।\n2. 'स्ट्रीट लाइट / बिजली' श्रेणी का चयन करें।\n3. सटीक स्थान और विवरण दर्ज करें।\n4. स्थानीय नगर निगम अधिकारी को यह शिकायत स्वचालित रूप से भेज दी जाएगी।",
        "default": "नमस्ते! मैं NagrikAI हूँ। मैं सरकारी योजनाओं, सेवाओं और शिकायतों के बारे में आपकी सहायता कर सकता हूँ। कृपया अपना प्रश्न पूछें।"
    },
    "en": {
        "birth": "Steps to get a Birth Certificate:\n1. Visit the local Municipal Corporation office or your state's online citizen service portal.\n2. Fill out Application Form 1.\n3. Attach proof of birth (hospital discharge summary) and parents' IDs (Aadhaar/Voter ID).\n4. Pay the processing fee.\n5. Upon verification, the certificate will be issued within 7-15 working days.",
        "awas": "Documents required for PM Awas Yojana (PMAY):\n- Identity Proof (Aadhaar Card, Voter ID, PAN Card)\n- Address Proof\n- Income Certificate / Form 16 / Salary slips\n- Bank Account details (statement for the last 6 months)\n- Affidavit stating the beneficiary does not own a concrete house anywhere in India.",
        "light": "To report a broken street light:\n1. Go to the 'Report an Issue' section on our platform.\n2. Select 'Streetlight / Electricity' category.\n3. Enter the exact location and description (optionally attach a photo).\n4. A complaint ticket will be generated and automatically routed to the municipal office.",
        "default": "Hello! I am NagrikAI. I can assist you with information on government schemes, eligibility, documents, or help you file and track complaints. What can I do for you today?"
    }
}

client = None
api_key = os.getenv("GEMINI_API_KEY")
if api_key and api_key != "PASTE_YOUR_API_KEY_HERE":
    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")

def generate_mock_vision_triage(category: str) -> dict:
    category_tags = {
        "Roads & Potholes": (["surface-damage (92%)", "pothole-detected (88%)"], 6),
        "Water Supply & Leaks": (["pipe-leak (94%)", "water-accumulation (85%)"], 5),
        "Streetlight / Electricity": (["electrical-hazard (90%)", "broken-fixture (87%)"], 7),
        "Garbage / Sanitation": (["waste-dump (91%)", "sanitation-hazard (89%)"], 4)
    }
    tags, severity = category_tags.get(category, (["general-hazard (75%)"], 3))
    return {
        "detected_category": category,
        "detected_description": f"Simulated visual evidence of a {category.lower()} issue detected from image analysis.",
        "confidence_score": 0.89,
        "severity_score": severity,
        "suggested_tags": tags
    }

def analyze_grievance_image(image_bytes: bytes, mime_type: str, category: str) -> dict:
    if not client:
        return generate_mock_vision_triage(category)
    
    prompt = (
        f"You are a computer vision model for municipal issue tracking. "
        f"Analyze this image which is reported under the category '{category}'. "
        f"1. Verify if it shows a civic problem matching or similar to the reported category. "
        f"2. Suggest detailed triage classification tags with accuracy percentage (e.g. 'pothole-detected (92%)'). "
        f"3. Rate the safety hazard severity on a scale of 1 to 10. "
        f"4. Provide a 1-sentence detected description of the issue."
    )
    
    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=VisionTriageResult,
                temperature=0.1
            )
        )
        # Parse the JSON response
        import json
        res_data = json.loads(response.text)
        return res_data
    except Exception as e:
        print(f"Error in Gemini multimodal vision analysis: {e}, falling back to mock vision triage")
        return generate_mock_vision_triage(category)

def generate_civic_assistance(query: str, history: list, language: str) -> str:
    lang_key = "hi" if language.startswith("hi") else "en"
    
    if not client:
        query_lower = query.lower()
        if "birth" in query_lower or "जन्म" in query_lower:
            return FALLBACK_ANSWERS[lang_key]["birth"]
        elif "awas" in query_lower or "yojana" in query_lower or "योजना" in query_lower:
            return FALLBACK_ANSWERS[lang_key]["awas"]
        elif "light" in query_lower or "बिजली" in query_lower or "स्ट्रीट" in query_lower:
            return FALLBACK_ANSWERS[lang_key]["light"]
        return FALLBACK_ANSWERS[lang_key]["default"]

    system_instruction = (
        "You are NagrikAI, an empathetic, factual, and highly accurate Indian civic companion. "
        "Your mission is to simplify complex government scheme eligibility and bureaucratic jargon. "
        "You must understand regional languages, dialects (including Hinglish and code-switching), and respond "
        f"strictly in the requested language: {language}. "
        "Act as an intuitive multi-step guide for government processes (e.g. renewing licenses, checking benefit status). "
        "Keep responses structured with bullet points or numbered lists. Cite official sources and helplines where possible."
    )
    
    try:
        formatted_contents = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            formatted_contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg.get("text", ""))]
                )
            )
        formatted_contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=query)]
            )
        )
        
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=formatted_contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
            ),
        )
        return response.text
    except Exception as e:
        print(f"Gemini API Exception, falling back to static database responses: {e}")
        query_lower = query.lower()
        if "birth" in query_lower or "जन्म" in query_lower:
            return FALLBACK_ANSWERS[lang_key]["birth"]
        elif "awas" in query_lower or "yojana" in query_lower or "योजना" in query_lower:
            return FALLBACK_ANSWERS[lang_key]["awas"]
        elif "light" in query_lower or "बिजली" in query_lower or "स्ट्रीट" in query_lower:
            return FALLBACK_ANSWERS[lang_key]["light"]
        return FALLBACK_ANSWERS[lang_key]["default"]
