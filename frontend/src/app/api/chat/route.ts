import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `You are NagrikAI, an empathetic, factual, and highly accurate Indian government civic companion. You speak with warmth, clarity, and patience.

## Core Mission
1. Simplify complex government scheme eligibility and bureaucratic jargon into plain, friendly language
2. Guide citizens through document requirements step-by-step with numbered lists
3. Recommend relevant public services based on the citizen's situation
4. Explain how to file and track civic complaints through official channels
5. Always respond in the SAME language the user writes in (Hindi → Hindi, Tamil → Tamil, etc.)

## Formatting Rules
- Use **bold** for important terms and document names
- Use numbered lists (1. 2. 3.) for steps/procedures
- Use bullet points (- item) for document lists
- Use ## headers to organize long responses
- Keep responses friendly but concise

## Key Government Schemes Knowledge Base

### PM-KISAN (PM Kisan Samman Nidhi)
- **Benefit:** ₹6,000/year in 3 installments of ₹2,000 directly to bank account
- **Eligibility:** All landholding farmer families with cultivable land
- **Documents:** Aadhaar card, land records/Khasra-Khatauni, bank passbook, mobile number
- **Apply:** pmkisan.gov.in or nearest CSC center
- **Helpline:** 155261 / 011-24300606

### Ayushman Bharat (PM-JAY)
- **Benefit:** ₹5 lakh/year health cover per family at empanelled hospitals
- **Eligibility:** Economically weaker sections as per SECC 2011 data
- **Documents:** Aadhaar, ration card, income certificate
- **Check eligibility:** pmjay.gov.in → "Am I Eligible?"
- **Helpline:** 14555

### PM Awas Yojana (PMAY) - Urban
- **Benefit:** Subsidy up to ₹2.67 lakh on home loan interest
- **Eligibility:** EWS (income <₹3L), LIG (₹3-6L), MIG (₹6-18L) — first-time homeowners
- **Documents:** Aadhaar, income proof, property documents, bank account
- **Apply:** pmaymis.gov.in

### PM Awas Yojana - Gramin (Rural)
- **Benefit:** ₹1.2 lakh (plains) / ₹1.3 lakh (hills/NE) for house construction
- **Eligibility:** Homeless or kutcha house owners from BPL/SC/ST categories
- **Documents:** Aadhaar, BPL card, bank passbook, caste certificate (if applicable)

### Birth Certificate
- **Apply at:** Municipal Corporation / Gram Panchayat / CSC center
- **Required documents:**
  - Hospital discharge slip or birth proof
  - Parents' Aadhaar cards
  - Parents' marriage certificate
  - Proof of address
- **Timeline:** 21 days from birth — free; after that, late fee applies
- **Online:** https://crsorgi.gov.in (in many states)

### Ration Card
- **Documents:** Aadhaar of all family members, address proof, income certificate, passport photo
- **Apply:** State Food Department portal or nearest ration office
- **Types:** APL (Above Poverty Line), BPL (Below Poverty Line), AAY (Antyodaya)

### DigiLocker
- **Use:** Store and share official documents digitally (Aadhaar, PAN, Marksheets, Driving License)
- **Link:** digilocker.gov.in or DigiLocker app
- **Documents available:** Aadhaar, PAN, Class 10/12 certificates, vehicle RC, driving license

### Reporting Civic Issues
- **Broken roads/lights/water:** CPGRAMS (cpgrams.gov.in) — national portal
- **State-level:** Most states have apps like MyGov, fix311, or state grievance portals
- **Process:** Register → describe issue with location → get complaint ID → track online
- **Alternative:** Call 1533 (National Grievance Helpline)

### DigiLocker / Document Services
- Store Aadhaar, PAN, Class 10/12 marksheets, driving license digitally
- Access at digilocker.gov.in or DigiLocker app

## Response Behavior
- If unsure about specific state-level details, say so and direct to the official state portal
- Always provide official website/helpline numbers when available
- For sensitive financial/legal matters, recommend consulting local CSC (Common Service Centre)
- Never make up scheme amounts, eligibility criteria, or document requirements`;

// Local rule-based matcher — bulletproof fallback for hackathon demo
function getLocalFallbackResponse(query: string): string {
  const q = query.toLowerCase().trim();

  // --- GREETINGS ---
  if (!q || q.match(/^(hi|hello|hey|helo|namaste|नमस्ते|vanakkam|namaskar|help|हेलो|help me)$/)) {
    return `## Hello! I am NagrikAI 🙏

I am your **AI-powered civic companion** for government services in India.

Here is what I can help you with today:

## Popular Services
1. **Birth Certificate** — how to apply, documents needed, deadlines
2. **PM Awas Yojana (PMAY)** — housing scheme benefits and eligibility
3. **PM-KISAN** — ₹6,000/year direct farmer support scheme
4. **Ayushman Bharat (PM-JAY)** — free health insurance up to ₹5 Lakh/year
5. **Ration Card** — documents, types (APL/BPL/AAY), how to apply
6. **DigiLocker** — how to store Aadhaar, PAN, certificates digitally
7. **Report a Civic Issue** — broken streetlights, roads, water, or garbage

**Try asking me:** "How to apply for Ayushman Bharat card?" or "Documents for ration card?"`;
  }

  // --- BIRTH CERTIFICATE ---
  if (q.includes("birth") || q.includes("जन्म") || q.includes("பிறப்பு") || q.includes("জন্ম") || (q.includes("certificate") && q.includes("child"))) {
    return `## Birth Certificate — Complete Guide

### Documents Required:
- **Hospital Discharge Slip** (proof of birth from hospital)
- **Aadhaar Cards** of both parents
- **Parents' Marriage Certificate**
- **Proof of Address** (Voter ID, utility bill, etc.)

### How to Apply:
1. Register the birth within **21 days** — completely **free** during this period
2. Visit your **Municipal Corporation**, Gram Panchayat office, or nearest CSC center
3. You can also apply online at [crsorgi.gov.in](https://crsorgi.gov.in) or your state's e-District portal
4. Submit the form with copies of documents and hospital discharge slip
5. Certificate is typically issued within **7–15 working days**

> **Late registration (after 21 days):** Late fees apply and verification by a local authority is required. After 30 days, a magistrate's affidavit may be needed.`;
  }

  // --- PM AWAS YOJANA ---
  if (q.includes("awas") || q.includes("pmay") || q.includes("housing") || q.includes("house") || q.includes("ghar") || q.includes("मकान") || q.includes("घर") || q.includes("வீடு") || q.includes("বাড়ি")) {
    return `## Pradhan Mantri Awas Yojana (PMAY)

### PMAY - Urban (PMAY-U)
- **Benefit:** Credit-linked interest subsidy up to **₹2.67 Lakh** on home loans
- **Eligibility:** First-time home buyers with annual income:
  - EWS: Up to ₹3 Lakh
  - LIG: ₹3–6 Lakh
  - MIG: ₹6–18 Lakh
- **Documents:** Aadhaar card, income proof (ITR/salary slip), bank statement
- **Apply:** [pmaymis.gov.in](https://pmaymis.gov.in) or nearest municipal office

### PMAY - Gramin / Rural (PMAY-G)
- **Benefit:** ₹1.2 Lakh (plains) / ₹1.3 Lakh (hills/North-East)
- **Eligibility:** Homeless or kutcha house owners in rural areas
- **Documents:** Aadhaar, bank passbook, MGNREGA Job Card, SECC code
- **Apply:** Contact your local **Gram Panchayat** or Gram Sevak`;
  }

  // --- PM KISAN ---
  if (q.includes("kisan") || q.includes("farmer") || q.includes("किसान") || q.includes("farm") || q.includes("agricultural") || q.includes("விவசாயி") || q.includes("কৃষক") || q.includes("pm kisan")) {
    return `## PM-KISAN (PM Kisan Samman Nidhi)

### Benefit:
- **₹6,000 per year** in 3 equal installments of **₹2,000** each
- Credited directly to the farmer's bank account via DBT

### Eligibility:
- All **landholding farmer families** owning cultivable agricultural land

### Documents Required:
- **Aadhaar Card** (must be seeded with bank account)
- **Land Ownership Records** (Khasra-Khatauni / Jamabandi)
- **Bank Passbook**
- **Active Mobile Number**

### How to Register:
1. Visit [pmkisan.gov.in](https://pmkisan.gov.in)
2. Click **'New Farmer Registration'**
3. Enter Aadhaar, state, and land record details
4. Alternatively, visit your nearest **CSC (Common Service Centre)**

**Helpline:** 155261 / 011-24300606`;
  }

  // --- AYUSHMAN BHARAT ---
  if (q.includes("ayushman") || q.includes("health") || q.includes("hospital") || q.includes("insurance") || q.includes("pmjay") || q.includes("स्वास्थ्य") || q.includes("golden card") || q.includes("pm jay")) {
    return `## Ayushman Bharat PM-JAY — Health Insurance

### Benefit:
- **₹5 Lakh per family per year** for hospitalization
- Fully **cashless and paperless** at all empanelled hospitals
- Covers 1,500+ medical procedures

### Who is Eligible:
- Families listed in **SECC 2011 data** (Socio-Economic Caste Census)
- Approximately 12 crore families across India

### Documents for Golden Card:
- **Aadhaar Card**
- **Ration Card**
- **Mobile Number** linked to Aadhaar

### How to Apply:
1. Check eligibility at [pmjay.gov.in](https://pmjay.gov.in) → click **"Am I Eligible?"**
2. Visit nearest **government hospital** or **CSC center**
3. Complete **biometric verification** with Aadhaar
4. Receive your **Golden Card** on the spot

**Helpline:** 14555 (Toll-free, 24×7)`;
  }

  // --- RATION CARD ---
  if (q.includes("ration") || q.includes("राशन") || q.includes("ration card") || q.includes("food") || q.includes("bpl") || q.includes("apl")) {
    return `## Ration Card — How to Apply

### Types of Ration Cards:
- **APL** (Above Poverty Line) — for general public
- **BPL** (Below Poverty Line) — subsidized grains at cheaper rates
- **AAY** (Antyodaya Anna Yojana) — for poorest of the poor

### Documents Required:
- **Aadhaar Cards** of all family members
- **Proof of Address** (Voter ID, electricity bill, rental agreement)
- **Income Certificate** (from Tehsildar or equivalent)
- **Passport-size photographs**

### How to Apply:
1. Visit your **State Food Department Portal** or nearest ration office
2. Submit the application with all documents
3. A field verification is done by a local inspector
4. Ration card is issued within **30 days** of approval`;
  }

  // --- CIVIC ISSUES / STREETLIGHT / ROAD ---
  if (q.includes("street") || q.includes("light") || q.includes("road") || q.includes("pothole") || q.includes("water") || q.includes("garbage") || q.includes("complain") || q.includes("report") || q.includes("issue") || q.includes("problem") || q.includes("सड़क") || q.includes("शिकायत")) {
    return `## How to Report Civic Issues (Roads, Streetlights, Water)

### Official Grievance Channels:

**1. CPGRAMS (National Portal)**
- Website: [cpgrams.gov.in](https://cpgrams.gov.in)
- File complaints online → routed to the correct department
- Get a **complaint tracking ID** via SMS

**2. Local Municipal Portals**
- Most cities have apps: *Swachhata App, MyGov, Fix311*
- Search for your city's official grievance app

**3. Helpline**
- Call **1533** — National toll-free municipal grievance helpline

### Information Needed to File:
- Exact location (landmark, ward number, pin code)
- Photo of the issue *(highly recommended)*
- Brief description: "Streetlight not working for 5 days on XYZ road"
- Your phone number for SMS status updates`;
  }

  // --- DIGILOCKER ---
  if (q.includes("digilocker") || q.includes("locker") || q.includes("digital") || q.includes("document") || q.includes("online") || q.includes("डिजिलॉकर")) {
    return `## DigiLocker — Your Digital Document Wallet

DigiLocker is a **free, government-backed** platform to store and share official documents online.

### Documents You Can Access:
- **Aadhaar Card** and **PAN Card**
- Class X and XII **Marksheets** and Certificates
- **Driving License** and Vehicle RC
- **Income and Caste Certificates** (in supported states)

### Why Use It:
- Documents are **legally equivalent** to physical originals (IT Act)
- No need to carry physical copies to government offices
- Share securely with authorities during KYC

### How to Register:
1. Go to [digilocker.gov.in](https://digilocker.gov.in) or download the **DigiLocker App**
2. Register with your **Aadhaar number** and linked mobile
3. Complete OTP verification
4. Search for your issuing authority and pull documents instantly`;
  }

  // --- DEFAULT: Smart catch-all ---
  return `## NagrikAI — Government Services Assistant

I couldn't find an exact match for **"${query}"**, but I can definitely help!

Here are the most commonly asked topics:

1. **Birth Certificate** — "How to apply for a birth certificate?"
2. **PM Awas Yojana** — "What are the documents for PMAY?"
3. **PM-KISAN** — "Am I eligible for PM Kisan scheme?"
4. **Ayushman Bharat** — "How to get PM-JAY Golden Card?"
5. **Ration Card** — "How to apply for BPL ration card?"
6. **Report an Issue** — "How to report a broken road?"
7. **DigiLocker** — "How to use DigiLocker for documents?"

Please rephrase your question using one of these topics and I will provide detailed step-by-step guidance!`;
}

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    query = body.query || "";

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "PASTE_YOUR_API_KEY_HERE" || apiKey.trim() === "") {
      // Return local fallback if API key is not set
      const fallbackResponse = getLocalFallbackResponse(query);
      return NextResponse.json({ response: fallbackResponse });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Build chat history for context (exclude current message)
    const chatHistory = (body.history || [])
      .slice(0, -1)
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(query);
    const responseText = result.response.text();
    return NextResponse.json({ response: responseText });

  } catch (error: any) {
    console.error("Gemini API error (routing to fallback):", error?.message);
    
    // In case of any API error (rate limits, network issues, 429), return local matched response
    const fallbackResponse = getLocalFallbackResponse(query);
    return NextResponse.json({ response: fallbackResponse });
  }
}
