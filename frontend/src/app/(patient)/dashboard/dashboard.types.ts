export type ReminderItem = {
  id: string;
  title: string;
  dueAt: string;
};

export type PatientDashboardData = {
  patientName: string;
  nextAppointment: string;
  reminders: ReminderItem[];
};
