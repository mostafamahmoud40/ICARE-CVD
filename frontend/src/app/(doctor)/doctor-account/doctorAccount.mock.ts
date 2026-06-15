import type { DoctorReview } from "./doctorAccount.types"

/** Placeholder until patient reviews are backed by API. */
export const MOCK_DOCTOR_RATING = {
  rating: 4.9,
  reviewCount: 128,
} as const

export const MOCK_DOCTOR_REVIEWS: DoctorReview[] = [
  {
    id: "rev-1",
    patientName: "Sara Ahmed",
    rating: 5,
    comment: "Clear explanation of my echo results and a practical treatment plan.",
    date: "2026-06-10T14:30:00Z",
  },
  {
    id: "rev-2",
    patientName: "Omar Hassan",
    rating: 5,
    comment: "Short wait time and very thorough follow-up on blood pressure logs.",
    date: "2026-06-08T11:15:00Z",
  },
  {
    id: "rev-3",
    patientName: "Layla Ibrahim",
    rating: 4,
    comment: "Professional visit. Would appreciate more time for questions next time.",
    date: "2026-06-05T16:00:00Z",
  },
]
