/**
 * UI-only placeholder “assistant” replies. Replace with real AI API when available.
 */
export function getMockAssistantReply(userText: string): string {
  const t = userText.toLowerCase()

  if (/\b(blood pressure|bp|heart rate|pulse|weight)\b/.test(t)) {
    return "I can’t see your vitals from this chat. In the app, log measurements on your dashboard or ask your care team to review recent readings. If you have chest pain, severe shortness of breath, or sudden weakness, seek emergency care."
  }
  if (/\b(med|medication|pill|dose|prescription)\b/.test(t)) {
    return "For medication changes or side effects, your doctor or pharmacist should advise you. I can help you think through questions to ask them, but I won’t suggest starting or stopping medicines."
  }
  if (/\b(appointment|schedule|book)\b/.test(t)) {
    return "You can book or view appointments from the Appointments section in your patient portal."
  }
  if (/\b(diet|food|salt|sodium|exercise|walk)\b/.test(t)) {
    return "Heart-healthy habits often include balanced meals, limiting added salt when your team recommends it, and regular movement that matches your fitness level. Your clinician can personalize this for your condition."
  }
  if (/\b(thank|thanks|hello|hi|hey)\b/.test(t)) {
    return "You’re welcome. Ask me anything about using the portal or general heart-health education — and remember I’m not a substitute for your care team."
  }

  return "Thanks for your message. This assistant is a demo for the graduation project: replies are not from a real clinician. Use Chats to message your doctor, or contact your care team for medical decisions."
}
