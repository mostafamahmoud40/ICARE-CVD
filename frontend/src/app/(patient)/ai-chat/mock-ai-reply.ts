import type { AiAssistantReply } from "./ai-chat.types"

/**
 * UI-only placeholder “assistant” replies. Replace with real AI API when available.
 */
export function getMockAssistantReply(userText: string): AiAssistantReply {
  const t = userText.toLowerCase()

  if (/\b(blood|lab|panel|cholesterol|glucose|vitamin|result)\b/.test(t)) {
    return {
      greeting: "Hello Elena,",
      text: "I've reviewed your latest blood panel from **yesterday**. Your glucose levels are ++within a healthy range++, but your LDL Cholesterol is !!135 mg/dL!! (Slightly High). Would you like to discuss dietary adjustments or schedule a follow-up with Dr. Aris?",
      actions: [
        { id: "view-lab", label: "View Lab PDF", icon: "download", href: "/patient/consultations" },
        { id: "book-followup", label: "Book Follow-up", icon: "calendar", href: "/patient/appointments" },
      ],
    }
  }

  if (/\b(blood pressure|bp|heart rate|pulse|weight|vital)\b/.test(t)) {
    return {
      greeting: "Alert Context Analyzed,",
      text: "Based on the vitals you just logged, your Blood Pressure is !!155/95 mmHg!! which indicates High Blood Pressure (Stage 2). Your Heart Rate is ++72 bpm++ (Normal).\n\nSince this BP reading is unusually high for your profile, please sit quietly for 5 minutes and retake it. If it remains high or you have chest pain, seek emergency care immediately.",
      actions: [
        { id: "log-vitals", label: "Log New Vitals", icon: "activity", href: "/patient/dashboard" },
        { id: "message-doctor", label: "Urgent Message to Doctor", icon: "alert", href: "/patient/chat" },
      ]
    }
  }

  if (/\b(med|medication|pill|dose|prescription|atorvastatin)\b/.test(t)) {
    return {
      greeting: "Medication Review,",
      text: "You are currently taking **Atorvastatin 20mg** daily in the evening. Adherence for this month is ++95%++ (Excellent). \n\nHowever, you missed your dose on **Tuesday**. Please continue taking it regularly as prescribed to manage your cholesterol levels. I cannot suggest stopping it.",
      actions: [
        { id: "view-meds", label: "View Medications", icon: "activity", href: "/patient/medications" },
        { id: "message-pharmacist", label: "Message Pharmacist", icon: "message", href: "/patient/chat" },
      ],
    }
  }

  if (/\b(appointment|schedule|book|follow-?up|visit)\b/.test(t)) {
    return {
      greeting: "Scheduling Assistant,",
      text: "Dr. Aris has available slots next week. The earliest available appointment is on **Thursday, March 12th at 10:30 AM**.\n\nWould you like me to reserve this slot for your cardiovascular follow-up?",
      actions: [
        { id: "book-appointment", label: "Confirm March 12th", icon: "calendar", href: "/patient/appointments" },
      ],
    }
  }

  if (/\b(chest|pain|breathe|shortness)\b/.test(t)) {
     return {
       greeting: "⚠️ MEDICAL ALERT",
       text: "You mentioned !!chest pain or shortness of breath!!. This can be a sign of a severe cardiovascular event.\n\nDo not wait. Please call emergency services (**911** or your local emergency number) immediately or go to the nearest emergency room.",
       actions: [
         { id: "emergency", label: "View Emergency Contacts", icon: "alert", href: "/patient/dashboard" }
       ]
     }
  }

  if (/\b(diet|food|salt|sodium|exercise|walk)\b/.test(t)) {
    return {
      text: "For your current Moderate Risk profile, maintaining daily sodium below **1,500 mg** is highly recommended. Your recent logged meals are ++perfectly balanced++. Keep up the great work with your 30-minute daily walks!",
    }
  }

  return {
    text: "Thanks for your message. I am your ICARE AI Co-Pilot. I can highlight important numbers like **120/80 mmHg**, point out high risk metrics like !!HbA1c 8.2%!!, or praise good results like ++Cholesterol 98 mg/dL++.\n\nHow can I assist you with your heart health today?",
  }
}
