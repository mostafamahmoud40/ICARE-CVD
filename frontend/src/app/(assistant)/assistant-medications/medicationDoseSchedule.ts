export type DoseTimeSlot = {
  time: string;
  label: string;
};

function formatHour(hour24: number): string {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12.toString().padStart(2, "0")}:00 ${period}`;
}

/** Build mock dose clock times from a frequency label (demo / UI only). */
export function buildDoseTimesFromFrequency(frequencyLabel: string): DoseTimeSlot[] {
  const freq = frequencyLabel.trim().toUpperCase();

  if (freq.includes("Q3H")) {
    return Array.from({ length: 8 }, (_, index) => {
      const hour24 = (6 + index * 3) % 24;
      return {
        time: formatHour(hour24),
        label: `Dose ${index + 1}`,
      };
    });
  }

  if (freq.includes("Q6H")) {
    return Array.from({ length: 4 }, (_, index) => {
      const hour24 = (6 + index * 6) % 24;
      return {
        time: formatHour(hour24),
        label: `Dose ${index + 1}`,
      };
    });
  }

  if (freq.includes("QID")) {
    return [
      { time: "08:00 AM", label: "Morning" },
      { time: "12:00 PM", label: "Noon" },
      { time: "04:00 PM", label: "Afternoon" },
      { time: "08:00 PM", label: "Evening" },
    ];
  }

  if (freq.includes("TID") || freq.includes("Q8H")) {
    return [
      { time: "06:00 AM", label: "Morning" },
      { time: "02:00 PM", label: "Afternoon" },
      { time: "10:00 PM", label: "Night" },
    ];
  }

  if (freq.includes("HS")) {
    return [{ time: "10:00 PM", label: "Bedtime" }];
  }

  if (freq.includes("QD")) {
    return [{ time: "09:00 AM", label: "Daily" }];
  }

  if (freq.includes("Q12H") || freq.includes("BID")) {
    return [
      { time: "08:00 AM", label: "Morning" },
      { time: "08:00 PM", label: "Evening" },
    ];
  }

  return [
    { time: "08:00 AM", label: "Morning" },
    { time: "08:00 PM", label: "Evening" },
  ];
}

export function isHighFrequencySchedule(doseTimes: DoseTimeSlot[]) {
  return doseTimes.length > 4;
}

/** Stable mock taken/missed pattern (avoids flicker on re-render). */
export function mockDoseStatus(dayIndex: number, doseIndex: number, frequencyLabel: string) {
  const freq = frequencyLabel.trim().toUpperCase();
  const seed = dayIndex * 17 + doseIndex * 31;

  if (freq.includes("Q3H")) {
    return seed % 5 !== 0 ? "taken" : "missed";
  }

  return seed % 7 !== 0 ? "taken" : "missed";
}
