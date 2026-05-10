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
        id: "pharmacy",
        title: "Pharmacy",
        detail: "1st floor — after your visit ends",
        status: "pending",
      },
    ],
    instructions: [
      {
        id: "i1",
        icon: "shield",
        title: "Stay in the waiting area",
        body: "We'll call your turn number — please stay nearby so you don't miss your slot.",
      },
      {
        id: "i2",
        icon: "file",
        title: "Have documents ready",
        body: "Insurance card, ID, and any recent test results speed up check-in.",
      },
      {
        id: "i3",
        icon: "clock",
        title: "Times are estimates",
        body: "Wait times change if earlier visits run long — refresh for the latest estimate.",
      },
      {
        id: "i4",
        icon: "heart",
        title: "Medications & allergies",
        body: "Tell the nurse about any new medications or symptoms before you go in.",
      },
    ],
  },
}
