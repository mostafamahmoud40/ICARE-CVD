import type { PatientQueueTodayResponse } from "./patientQueue.types"

const finish = new Date()
finish.setHours(10, 30, 0, 0)

/** Demo snapshot when GET /patient/queue/today is unavailable */
export const mockPatientQueueToday: PatientQueueTodayResponse = {
  page: {
    clinicName: "ICARE-CVD",
    departmentLabel: "Cardiology department",
    fileNumber: "CV-10492",
    genderLabel: "Male",
    age: 63,
  },
  visit: {
    queueEntryId: "pq-demo-001",
    status: "waiting",
    scheduledTime: "2026-05-05T10:30:00.000Z",
    doctorName: "Dr. Mohamed Hanafi",
    doctorTitle: "Cardiology consultant",
    department: "Cardiology Clinic",
    roomNumber: "Exam Room 3",
    doctorLocationDetail: "Exam Room 3 · 3rd floor",
    nowCallingNumber: 43,
    yourTurnNumber: 47,
    peopleAhead: 4,
    estimatedWaitMin: 25,
    averageExamMin: 6,
    estimatedFinishTime: finish.toISOString(),
    callingLocationLabel: "Examination Room 2",
    cancelledTicketNumbers: [45],
    arrivedAt: new Date(new Date().setHours(8, 45, 0, 0)).toISOString(),
    waitingSince: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    startedAt: null,
    completedAt: null,
    visitTypeLabel: "Today's clinic visit",
    alertsNote: "Allow browser notifications for this site when the clinic enables push alerts.",
    stages: [
      {
        id: "check-in",
        title: "Check-in",
        detail: "Registered at reception",
        status: "done",
        timeLabel: "8:45 AM",
        locationLabel: "Reception",
      },
      {
        id: "labs",
        title: "Labs & imaging",
        detail: "Required tests before your consult",
        status: "done",
        timeLabel: "9:10 AM",
        locationLabel: "2nd floor lab",
      },
      {
        id: "wait-exam",
        title: "Waiting for examination",
        detail: "With Dr. Mohamed Hanafi · Exam Room 3",
        status: "in-progress",
        locationLabel: "Waiting area · Cardiology",
      },
      {
        id: "exam",
        title: "Examination & consultation",
        detail: "Starts when your turn number is called",
        status: "pending",
      },
      {
        id: "prescription",
        title: "Prescription from your doctor",
        detail: "Issued at the end of your consultation",
        status: "pending",
      },
    ],
    instructions: [
      {
        id: "i1",
        icon: "shield",
        title: "Relax in our lounge",
        body: "Please make yourself comfortable nearby. We'll call your number as soon as the doctor is ready for you.",
      },
      {
        id: "i2",
        icon: "file",
        title: "Prepare your documents",
        body: "Having your ID and insurance card handy helps us get you to your doctor faster and smoother.",
      },
      {
        id: "i3",
        icon: "clock",
        title: "About your wait time",
        body: "Our times are estimates as we give each patient the care they need. Thank you for your patience!",
      },
      {
        id: "i4",
        icon: "heart",
        title: "Your health updates",
        body: "Feel free to share any new symptoms or medication changes with the nurse before your visit begins.",
      },
    ],
  },
}
