export const CARDIAC_HISTORY_QUESTIONS = [
  ["pastHypertension", "High blood pressure", "Hypertension"],
  ["pastMI", "Heart attack", "Myocardial infarction"],
  ["pastHeartFailure", "Weak or failing heart", "Heart failure"],
  ["pastCardiomyopathy", "Cardiomyopathy", "Heart muscle disease"],
  ["pastValvular", "Heart valve problem", "Leaking/narrow valve"],
  ["pastArrhythmias", "Irregular heartbeat", "Arrhythmia"],
  ["pastStrokeCardiac", "Stroke or mini-stroke", "TIA/stroke history"],
  ["pastEndocarditis", "Heart valve infection", "Endocarditis"],
  ["pastRheumatic", "Rheumatic fever", "Childhood rheumatic disease"],
  ["pastPulmonaryHypertension", "Pulmonary hypertension", "High pressure in lung vessels"],
] as const

export const NON_CARDIAC_HISTORY_QUESTIONS = [
  ["pastStroke", "Stroke or TIA", "Brain attack or mini-stroke"],
  ["pastCKD", "Chronic kidney disease", "Long-term kidney problems"],
  ["pastLungDisease", "Chronic lung disease", "COPD, asthma, etc."],
  ["pastThyroid", "Thyroid disease", "Underactive or overactive thyroid"],
  ["pastLiver", "Liver disease", "Hepatitis, cirrhosis, etc."],
  ["pastAnemia", "Anemia", "Low blood count"],
  ["pastAutoimmune", "Autoimmune disease", "Lupus, RA, etc."],
  ["pastMalignancy", "Cancer / malignancy", "Any cancer history"],
  ["pastSleepApnea", "Sleep apnea", "Breathing pauses in sleep"],
] as const

export const HISTORY_ANSWER_OPTIONS = ["Yes", "No", "Not sure"] as const

export type HistoryAnswer = (typeof HISTORY_ANSWER_OPTIONS)[number] | ""

export const FAMILY_RELATIONSHIP_OPTIONS = [
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Grandmother",
  "Grandfather",
  "Aunt",
  "Uncle",
  "Daughter",
  "Son",
  "Cousin",
  "Other",
] as const
