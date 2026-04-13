import type { ChatContact, ChatMessage } from "./chat.types"

// Temporary Data (Violates DIP if hardcoded in UI, so we abstract it here to mock API)
export const MOCK_CONTACTS: ChatContact[] = [
  {
    id: "c1",
    name: "Dr. Sarah Johnson",
    role: "Cardiologist",
    avatar: "https://i.pravatar.cc/150?u=dr_sarah",
    lastMessage: "Your latest ECG looks completely normal.",
    time: "10:42 AM",
    unread: 2,
    online: true,
  },
  {
    id: "c2",
    name: "AI Health Assistant",
    role: "System Bot",
    avatar: "https://i.pravatar.cc/150?u=ai_bot",
    lastMessage: "Don't forget to take your medication today.",
    time: "Yesterday",
    unread: 0,
    online: true,
  },
  {
    id: "c3",
    name: "Dr. Michael Chen",
    role: "Primary Care",
    avatar: "https://i.pravatar.cc/150?u=dr_michael",
    lastMessage: "I've sent the referral to the cardiovascular unit.",
    time: "Monday",
    unread: 0,
    online: false,
  },
]

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    contactId: "c1",
    text: "Good morning! I wanted to follow up on your recent lab results.",
    time: "10:30 AM",
    isSender: false,
    status: "read",
  },
  {
    id: "m2",
    contactId: "c1",
    text: "Good morning, Dr. Johnson. Thank you, everything is okay?",
    time: "10:35 AM",
    isSender: true,
    status: "read",
  },
  {
    id: "m3",
    contactId: "c1",
    text: "Yes, overall everything is stable. Your latest ECG looks completely normal, which is great news.",
    time: "10:41 AM",
    isSender: false,
    status: "read",
  },
  {
    id: "m4",
    contactId: "c1",
    text: "We should just keep an eye on your blood pressure. Please continue tracking it daily.",
    time: "10:42 AM",
    isSender: false,
    status: "read",
  },
]
