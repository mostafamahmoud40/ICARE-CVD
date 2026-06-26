type VitalTrend = 'up' | 'down' | 'stable';

export type PatientVitalHistoryItem = {
  date: string;
  label: string;
  systolic: number | null;
  diastolic: number | null;
  heartRate: number | null;
  spo2: number | null;
  weight: number | null;
  temperature: number | null;
  aiNote?: string;
  aiNoteType?: 'normal' | 'alert' | 'monitoring' | 'info';
};

export type PatientCurrentVitals = {
  bloodPressure: {
    systolic: number | null;
    diastolic: number | null;
    trend: VitalTrend;
    trendValue: string;
  };
  heartRate: {
    value: number | null;
    trend: VitalTrend;
    trendValue: string;
  };
  spo2: {
    value: number | null;
    trend: VitalTrend;
    trendValue: string;
  };
  weight: {
    value: number | null;
    trend: VitalTrend;
    trendValue: string;
  };
};

export type PatientVitalInsightItem = {
  id: string;
  title: string;
  description: string;
  action?: { label: string };
};

export type VitalReadingSnapshot = {
  date: Date;
  systolicBp: number | null;
  diastolicBp: number | null;
  heartRate: number | null;
  oxygenSaturation: number | null;
  temperature: string | null;
  weight: string | null;
  notes: string | null;
};

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parseNumber(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeTrend(
  latest: number | null,
  baseline: number | null,
  unit: string,
  decimals = 0,
): { trend: VitalTrend; trendValue: string } {
  if (latest == null || baseline == null) {
    return { trend: 'stable', trendValue: '—' };
  }

  const delta = latest - baseline;
  if (Math.abs(delta) < (decimals > 0 ? 0.05 : 1)) {
    return { trend: 'stable', trendValue: '—' };
  }

  const trend: VitalTrend = delta > 0 ? 'up' : 'down';
  const formatted =
    decimals > 0
      ? `${delta > 0 ? '+' : ''}${delta.toFixed(decimals)} ${unit}`
      : `${delta > 0 ? '+' : ''}${Math.round(delta)} ${unit}`;

  return { trend, trendValue: formatted };
}

export function isAbnormalVitalReading(reading: VitalReadingSnapshot): boolean {
  const systolic = reading.systolicBp;
  const diastolic = reading.diastolicBp;
  const heartRate = reading.heartRate;
  const spo2 = reading.oxygenSaturation;

  return (
    (systolic != null && (systolic >= 140 || systolic <= 90)) ||
    (diastolic != null && diastolic >= 90) ||
    (heartRate != null && (heartRate >= 100 || heartRate <= 60)) ||
    (spo2 != null && spo2 <= 94)
  );
}

export function isElevatedBloodPressure(
  reading: VitalReadingSnapshot,
): boolean {
  const systolic = reading.systolicBp;
  const diastolic = reading.diastolicBp;
  return (
    (systolic != null && systolic >= 140) ||
    (diastolic != null && diastolic >= 90)
  );
}

export function aggregateReadingsByDate(
  readings: VitalReadingSnapshot[],
): PatientVitalHistoryItem[] {
  const byDate = new Map<string, PatientVitalHistoryItem>();

  const sorted = [...readings].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  for (const reading of sorted) {
    const dateKey = formatIsoDate(reading.date);
    const existing = byDate.get(dateKey) ?? {
      date: dateKey,
      label: formatDateLabel(reading.date),
      systolic: null,
      diastolic: null,
      heartRate: null,
      spo2: null,
      weight: null,
      temperature: null,
    };

    if (reading.systolicBp != null) existing.systolic = reading.systolicBp;
    if (reading.diastolicBp != null) existing.diastolic = reading.diastolicBp;
    if (reading.heartRate != null) existing.heartRate = reading.heartRate;
    if (reading.oxygenSaturation != null)
      existing.spo2 = reading.oxygenSaturation;
    if (reading.weight != null) existing.weight = parseNumber(reading.weight);
    if (reading.temperature != null) {
      existing.temperature = parseNumber(reading.temperature);
    }

    if (reading.notes) {
      existing.aiNote = reading.notes;
      existing.aiNoteType = 'info';
    } else if (isAbnormalVitalReading(reading)) {
      existing.aiNote = 'Alert sent';
      existing.aiNoteType = 'alert';
    } else if (
      existing.systolic != null ||
      existing.diastolic != null ||
      existing.heartRate != null
    ) {
      existing.aiNote = 'Normal';
      existing.aiNoteType = 'normal';
    }

    byDate.set(dateKey, existing);
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

export function buildCurrentVitals(
  history: PatientVitalHistoryItem[],
): PatientCurrentVitals {
  const withBp = history.filter(
    (item) => item.systolic != null && item.diastolic != null,
  );
  const withHr = history.filter((item) => item.heartRate != null);
  const withSpo2 = history.filter((item) => item.spo2 != null);
  const withWeight = history.filter((item) => item.weight != null);

  const latestBp = withBp.at(-1);
  const latestHr = withHr.at(-1);
  const latestSpo2 = withSpo2.at(-1);
  const latestWeight = withWeight.at(-1);

  const baselineBp = average(
    withBp
      .slice(0, Math.max(0, withBp.length - 1))
      .map((item) => item.systolic!),
  );
  const baselineHr = average(
    withHr
      .slice(0, Math.max(0, withHr.length - 1))
      .map((item) => item.heartRate!),
  );
  const baselineSpo2 = average(
    withSpo2
      .slice(0, Math.max(0, withSpo2.length - 1))
      .map((item) => item.spo2!),
  );
  const baselineWeight = average(
    withWeight
      .slice(0, Math.max(0, withWeight.length - 1))
      .map((item) => item.weight!),
  );

  const bpTrend = computeTrend(latestBp?.systolic ?? null, baselineBp, 'mmHg');
  const hrTrend = computeTrend(latestHr?.heartRate ?? null, baselineHr, 'bpm');
  const spo2Trend = computeTrend(latestSpo2?.spo2 ?? null, baselineSpo2, '%');
  const weightTrend = computeTrend(
    latestWeight?.weight ?? null,
    baselineWeight,
    'kg',
    1,
  );

  return {
    bloodPressure: {
      systolic: latestBp?.systolic ?? null,
      diastolic: latestBp?.diastolic ?? null,
      trend: bpTrend.trend,
      trendValue: bpTrend.trendValue,
    },
    heartRate: {
      value: latestHr?.heartRate ?? null,
      trend: hrTrend.trend,
      trendValue: hrTrend.trendValue,
    },
    spo2: {
      value: latestSpo2?.spo2 ?? null,
      trend: spo2Trend.trend,
      trendValue: spo2Trend.trendValue,
    },
    weight: {
      value: latestWeight?.weight ?? null,
      trend: weightTrend.trend,
      trendValue: weightTrend.trendValue,
    },
  };
}

export function buildClinicalAlert(
  readings: VitalReadingSnapshot[],
  history: PatientVitalHistoryItem[],
): string | null {
  const withBp = history.filter(
    (item) => item.systolic != null && item.diastolic != null,
  );
  if (withBp.length === 0) return null;

  const baseline = average(
    withBp
      .slice(0, Math.max(0, withBp.length - 1))
      .map((item) => item.systolic!),
  );

  const abnormalReadings = readings
    .filter(isElevatedBloodPressure)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const latestAbnormal = abnormalReadings[0];
  if (!latestAbnormal) return null;

  const aboveUsual =
    baseline != null &&
    latestAbnormal.systolicBp != null &&
    latestAbnormal.systolicBp > baseline + 5;

  if (!aboveUsual && !isElevatedBloodPressure(latestAbnormal)) {
    return null;
  }

  const label = formatDateLabel(latestAbnormal.date);
  return `Blood pressure on ${label} was ${latestAbnormal.systolicBp}/${latestAbnormal.diastolicBp} — higher than your usual range. Your care team has been notified.`;
}

export function buildTrendSummary(history: PatientVitalHistoryItem[]): {
  title: string;
  body: string;
} | null {
  const withBp = history.filter((item) => item.systolic != null);
  const withHr = history.filter((item) => item.heartRate != null);

  if (withBp.length < 2) return null;

  const first = withBp[0].systolic!;
  const last = withBp.at(-1)!.systolic!;
  const percentChange = Math.round(((first - last) / first) * 100);

  let bpSentence: string;
  if (percentChange > 3) {
    bpSentence = `Systolic pressure reduced by ${percentChange}% compared to your history.`;
  } else if (percentChange < -3) {
    bpSentence = `Systolic pressure increased by ${Math.abs(percentChange)}% compared to your history.`;
  } else {
    bpSentence = 'Systolic pressure is stable compared to your history.';
  }

  let hrSentence = '';
  if (withHr.length >= 2) {
    const hrValues = withHr.map((item) => item.heartRate!);
    const min = Math.min(...hrValues);
    const max = Math.max(...hrValues);
    if (max - min <= 10) {
      hrSentence =
        ' Heart rate is stable within the safe range for your age and condition.';
    } else {
      hrSentence =
        ' Heart rate shows some variation — keep logging readings at the same time of day.';
    }
  }

  return {
    title: 'Last 3 months — trend summary',
    body: `${bpSentence}${hrSentence}`,
  };
}

export function buildAiAnalysisItems(
  history: PatientVitalHistoryItem[],
): PatientVitalInsightItem[] {
  const items: PatientVitalInsightItem[] = [];
  const withBp = history.filter((item) => item.systolic != null);
  const withWeight = history.filter((item) => item.weight != null);

  if (withBp.length >= 2) {
    const first = withBp[0].systolic!;
    const last = withBp.at(-1)!.systolic!;
    if (last < first - 5) {
      items.push({
        id: 'bp-trend',
        title: 'Positive trend in blood pressure',
        description:
          'Your recent readings show a gradual reduction compared to earlier measurements.',
      });
    }
  }

  if (withWeight.length >= 2) {
    const first = withWeight[0].weight!;
    const last = withWeight.at(-1)!.weight!;
    const delta = first - last;
    if (delta >= 2) {
      items.push({
        id: 'weight',
        title: 'Weight loss faster than target',
        description: `You lost ${delta.toFixed(1)} kg over the logged period. You may want your doctor to review this.`,
        action: { label: 'Review & send to doctor' },
      });
    }
  }

  const dates = history
    .map((item) => new Date(item.date).getTime())
    .sort((a, b) => a - b);
  for (let i = 1; i < dates.length; i++) {
    const gapDays = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    if (gapDays >= 10) {
      items.push({
        id: 'missed',
        title: 'Missed measurement',
        description:
          'There is a gap of more than a week between readings. Add a measurement when you can.',
        action: { label: 'Add missing reading' },
      });
      break;
    }
  }

  if (withBp.length >= 3) {
    items.push({
      id: 'compare',
      title: 'Compared to similar patients',
      description:
        'Your recent blood pressure readings are within a healthy improvement range for ongoing monitoring.',
    });
  }

  return items;
}

export function buildKpiBadges(current: PatientCurrentVitals): {
  bloodPressure: string | null;
  heartRate: string | null;
  spo2: string | null;
  weight: string | null;
} {
  const bloodPressure =
    current.bloodPressure.systolic != null &&
    current.bloodPressure.diastolic != null
      ? current.bloodPressure.systolic < 130 &&
        current.bloodPressure.diastolic < 85
        ? 'Within your normal range'
        : 'Above target — keep monitoring'
      : null;

  const heartRate =
    current.heartRate.value != null
      ? current.heartRate.value >= 60 && current.heartRate.value <= 100
        ? 'Stable for your age'
        : 'Outside typical resting range'
      : null;

  const spo2 =
    current.spo2.value != null
      ? current.spo2.value >= 95
        ? 'Excellent'
        : 'Below optimal — recheck soon'
      : null;

  const weight =
    current.weight.trend === 'down' && current.weight.trendValue !== '—'
      ? 'Faster drop than usual'
      : current.weight.value != null
        ? 'Tracking normally'
        : null;

  return { bloodPressure, heartRate, spo2, weight };
}
