"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Droplet,
  HeartPulse,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  Syringe,
  User,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
// (unused Select + cn imports removed)

import {
  ConstitutionalHpi,
  CyanosisHpi,
  EdemaHpi,
  EmbolizationHpi,
  FatigueHpi,
  HepaticCongestionHpi,
  JaundiceHpi,
  NeurologicalHpi,
  PalpitationsHpi,
  PeripheralVascularHpi,
  SyncopeHpi,
} from "./MedicalHpiBlocks";
import { PastInterventionsSection } from "./PastInterventionsSection";
import type { RegisterMedicalValues } from "./register.types";
import {
  ChipMultiField,
  MedicalNativeSelect as NativeSelect,
  NyhaSegmented,
  PillowStepper,
  SeverityDotScale,
  YesNoToggle,
} from "./registerMedicalUi";
import {
  REGISTER_INPUT,
  REGISTER_OUTLINE_BTN,
  REGISTER_PRIMARY_BTN,
  REGISTER_SECTION_CARD,
  RegisterSectionHeader,
} from "./registerSectionUi";

/* ────── Props (DIP: no store/context dependency) ────── */

type Step4MedicalHistoryProps = {
  medicalValues: RegisterMedicalValues;
  medicalStepErrors: { chiefComplaint?: string };
  onFieldChange: (field: string, value: unknown) => void;
  onPrevious: () => void;
  onNext: () => void;
};

/* ────── Constants ────── */

// (unused FAMILY_RELATIONSHIP_OPTIONS removed)

const CHEST_PAIN_PROVOKING = [
  { id: "exertion", label: "Exertion" },
  { id: "stress", label: "Stress" },
  { id: "meals", label: "Meals" },
  { id: "cold", label: "Cold" },
  { id: "spontaneous", label: "Spontaneous" },
] as const;

const CHEST_PAIN_QUALITY = [
  { id: "pressure", label: "Pressure" },
  { id: "tightness", label: "Tightness" },
  { id: "stabbing", label: "Stabbing" },
  { id: "burning", label: "Burning" },
  { id: "heaviness", label: "Heaviness" },
] as const;

const CHEST_PAIN_RADIATION = [
  { value: "none", label: "None" },
  { value: "left_arm", label: "Left arm" },
  { value: "jaw", label: "Jaw" },
  { value: "back", label: "Back" },
  { value: "epigastrium", label: "Epigastrium" },
  { value: "right_arm", label: "Right arm" },
  { value: "shoulder", label: "Shoulder" },
] as const;

const CHEST_PAIN_RELIEVING = [
  { id: "rest", label: "Rest" },
  { id: "nitrates", label: "Nitrates" },
  { id: "position", label: "Position" },
  { id: "nothing", label: "Nothing" },
] as const;

const CHEST_PAIN_ASSOCIATED = [
  { id: "dyspnea", label: "Dyspnea" },
  { id: "diaphoresis", label: "Diaphoresis" },
  { id: "nausea", label: "Nausea" },
  { id: "vomiting", label: "Vomiting" },
  { id: "palpitations", label: "Palpitations" },
  { id: "syncope", label: "Syncope" },
] as const;

const DYSPNEA_RELATION = [
  { id: "exertion", label: "Exertion" },
  { id: "lying_flat", label: "Lying flat" },
  { id: "posture", label: "Posture" },
  { id: "none", label: "None" },
] as const;

const DYSPNEA_COUGH_PRODUCTIVE_COLOR = [
  { value: "clear", label: "Clear" },
  { value: "white", label: "White" },
  { value: "yellow", label: "Yellow" },
  { value: "green", label: "Green" },
  { value: "blood_tinged", label: "Blood-tinged" },
  { value: "rust", label: "Rust-brown" },
  { value: "other", label: "Other" },
] as const;

const DYSPNEA_COUGH_PRODUCTIVE_AMOUNT = [
  { value: "scant", label: "Scant" },
  { value: "small", label: "Small" },
  { value: "moderate", label: "Moderate" },
  { value: "large", label: "Large" },
] as const;

/* ────── HPI reset mapping (module-level for stability) ────── */

const COMPLAINT_HPI_FIELDS = {
  "chest-pain": [
    "chestPainOnsetDate",
    "chestPainOnsetType",
    "chestPainProvoking",
    "chestPainQuality",
    "chestPainRadiation",
    "chestPainSeverity",
    "chestPainTimingPattern",
    "chestPainTimingDuration",
    "chestPainRelieving",
    "chestPainAssociated",
  ],
  dyspnea: [
    "dyspneaOnsetProgression",
    "dyspneaNYHA",
    "dyspneaOrthopnea",
    "dyspneaOrthopneaPillows",
    "dyspneaPND",
    "dyspneaWheezing",
    "dyspneaCough",
    "dyspneaProductiveColor",
    "dyspneaProductiveAmount",
    "dyspneaHemoptysis",
    "dyspneaRelationTo",
  ],
  palpitations: [
    "palpitationsOnsetType",
    "palpitationsDuration",
    "palpitationsRhythm",
    "palpitationsRate",
    "palpitationsTriggers",
    "palpitationsTermination",
    "palpitationsAssociated",
  ],
  syncope: [
    "syncopeCircumstances",
    "syncopeProdrome",
    "syncopeLocDuration",
    "syncopeRecovery",
    "syncopeInjury",
    "syncopePreviousSimilar",
    "syncopePreviousCount",
    "syncopeFamilySuddenDeath",
  ],
  "leg-swelling": [
    "edemaLocation",
    "edemaSymmetry",
    "edemaSide",
    "edemaDiurnal",
    "edemaWeightGain",
    "edemaWeightGainKg",
    "edemaDiureticResponse",
  ],
  fatigue: ["fatigueNYHA", "fatigueOnset", "fatigueAssociated"],
  "constitutional-infective": [
    "constitFever",
    "constitFeverOnsetDate",
    "constitFeverPattern",
    "constitChills",
    "constitNightSweats",
    "constitWeightLoss",
    "constitWeightLossAmount",
    "constitWeightLossTimeframe",
    "constitFatigue",
  ],
  "peripheral-vascular": [
    "pvClaudication",
    "pvSite",
    "pvDistanceMeters",
    "pvReliefRest",
    "pvProgression",
    "pvRestPain",
    "pvUlcers",
    "pvColdExtremities",
  ],
  "hepatic-congestion": ["hepaticDistension", "hepaticEpigastric", "hepaticNausea", "hepaticAppetite"],
  jaundice: ["jaundiceOnsetDate", "jaundiceCourse", "jaundiceDarkUrine", "jaundicePaleStools", "jaundicePruritus"],
  cyanosis: ["cyanosisType", "cyanosisTiming", "cyanosisOnset"],
  "systemic-embolization": ["embLimbPain", "embVisualLoss", "embFlankPain", "embAbdominalPain", "embTIA", "embStroke"],
  neurological: ["neuroDizziness", "neuroSyncope", "neuroWeakness", "neuroSpeech", "neuroVisual", "neuroConfusion"],
} as const satisfies Record<string, readonly string[]>;

const HPI_ARRAY_FIELDS = new Set<string>([
  "chestPainProvoking",
  "chestPainQuality",
  "chestPainRelieving",
  "chestPainAssociated",
  "dyspneaRelationTo",
  "palpitationsTriggers",
  "palpitationsAssociated",
  "syncopeCircumstances",
  "syncopeProdrome",
  "edemaLocation",
  "fatigueAssociated",
  "pvSite",
  "cyanosisType",
]);

function ChoiceButtons({
  options,
  value,
  onClick,
  compact = false,
}: {
  options: string[];
  value: string;
  onClick: (next: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap", compact ? "gap-1" : "gap-1.5")}>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          onClick={() => onClick(option)}
          className={cn(
            "rounded-lg border font-semibold transition-colors",
            compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
            value === option
              ? option === "Yes"
                ? "border-[#1A5345] bg-[#1A5345] text-white shadow-sm"
                : option === "No"
                  ? "border-[#E8E6E0] bg-[#F4F3ED] text-[#1A1F1E]"
                  : "border-amber-400 bg-amber-50 text-amber-800"
              : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC] hover:bg-[#F9F8F5]",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const CARDIAC_HISTORY_QUESTIONS = [
  ["pastHypertension", "High blood pressure", "Hypertension"],
  ["pastMI", "Heart attack", "Myocardial infarction"],
  ["pastHeartFailure", "Weak or failing heart", "Heart failure"],
  ["pastCardiomyopathy", "Cardiomyopathy", "Heart muscle disease"],
  ["pastValvular", "Heart valve problem", "Leaking/narrow valve"],
  ["pastArrhythmias", "Irregular heartbeat", "Arrhythmia"],
  ["pastStroke", "Stroke or mini-stroke", "TIA/stroke history"],
  ["pastEndocarditis", "Heart valve infection", "Endocarditis"],
  ["pastRheumatic", "Rheumatic fever", "Childhood rheumatic disease"],
  ["pastPulmonaryHypertension", "Pulmonary hypertension", "High pressure in lung vessels"],
] as const;

const NON_CARDIAC_HISTORY_QUESTIONS = [
  ["pastStroke", "Stroke or TIA", "Brain attack or mini-stroke"],
  ["pastCKD", "Chronic kidney disease", "Long-term kidney problems"],
  ["pastLungDisease", "Chronic lung disease", "COPD, asthma, etc."],
  ["pastThyroid", "Thyroid disease", "Underactive or overactive thyroid"],
  ["pastLiver", "Liver disease", "Hepatitis, cirrhosis, etc."],
  ["pastAnemia", "Anemia", "Low blood count"],
  ["pastAutoimmune", "Autoimmune disease", "Lupus, RA, etc."],
  ["pastMalignancy", "Cancer / malignancy", "Any cancer history"],
  ["pastSleepApnea", "Sleep apnea", "Breathing pauses in sleep"],
] as const;

function PastHistoryQuestionGrid({
  questions,
  getValue,
  onSelect,
}: {
  questions: readonly (readonly [string, string, string])[];
  getValue: (field: string) => string;
  onSelect: (field: string, value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {questions.map(([field, title, subtitle]) => (
        <div
          key={field}
          className="flex flex-col gap-2 rounded-xl border border-[#E8E6E0]/50 bg-[#F9F8F5]/50 p-3"
        >
          <p className="text-[13px] font-semibold leading-snug text-[#1A1F1E]" title={subtitle}>
            {title}
          </p>
          <ChoiceButtons
            compact
            options={["Yes", "No", "Not sure"]}
            value={getValue(field)}
            onClick={(val) => onSelect(field, val)}
          />
        </div>
      ))}
    </div>
  );
}

function PastMedicalHistoryTabs({
  getValue,
  onSelect,
  isNoCardiacHistory,
  isNoNonCardiacHistory,
  onToggleNoCardiacHistory,
  onToggleNoNonCardiacHistory,
}: {
  getValue: (field: string) => string;
  onSelect: (field: string, value: string) => void;
  isNoCardiacHistory: boolean;
  isNoNonCardiacHistory: boolean;
  onToggleNoCardiacHistory: () => void;
  onToggleNoNonCardiacHistory: () => void;
}) {
  const [tab, setTab] = useState<"cardiac" | "non-cardiac">("cardiac");

  const tabs = [
    {
      id: "cardiac" as const,
      label: "Cardiac",
      questions: CARDIAC_HISTORY_QUESTIONS,
      noHistory: isNoCardiacHistory,
      onToggleNoHistory: onToggleNoCardiacHistory,
      noHistoryLabel: "No cardiac history",
      emptyMessage: "Patient reports no significant cardiac history",
    },
    {
      id: "non-cardiac" as const,
      label: "Non-cardiac",
      questions: NON_CARDIAC_HISTORY_QUESTIONS,
      noHistory: isNoNonCardiacHistory,
      onToggleNoHistory: onToggleNoNonCardiacHistory,
      noHistoryLabel: "No non-cardiac history",
      emptyMessage: "Patient reports no significant non-cardiac medical history",
    },
  ] as const;

  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  function progress(questions: readonly (readonly [string, string, string])[]) {
    const answered = questions.filter(([field]) => getValue(field).trim()).length;
    return { answered, total: questions.length };
  }

  return (
    <div className={REGISTER_SECTION_CARD}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <RegisterSectionHeader icon={HeartPulse} label="Past medical history" />
        <button
          type="button"
          onClick={active.onToggleNoHistory}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
            active.noHistory
              ? "border-[#1A5345] bg-[#1A534518] text-[#1A5345]"
              : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC]",
          )}
        >
          {active.noHistory ? <CheckCircle2 className="size-3.5" /> : null}
          {active.noHistoryLabel}
        </button>
      </div>

      <div
        className="mb-2 flex items-center gap-0.5 border-b border-[#E8E6E0]/60"
        role="tablist"
        aria-label="Past medical history type"
      >
        {tabs.map((item) => {
          const isActive = tab === item.id;
          const { answered, total } = progress(item.questions);
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(item.id)}
              className={cn(
                "relative -mb-px inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
                isActive
                  ? "text-[#1A5345] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[#1A5345]"
                  : "text-[#6B7870] hover:text-[#1A1F1E]",
              )}
            >
              {item.label}
              <span className="tabular-nums text-[10px] font-medium text-[#9CA3AF]">
                {answered}/{total}
              </span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {!active.noHistory ? (
          <PastHistoryQuestionGrid
            questions={active.questions}
            getValue={getValue}
            onSelect={onSelect}
          />
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/60 p-3 text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm">{active.emptyMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

type MedicationItem = {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  type: string;
  compliance: "good" | "poor" | "";
  sideEffects: string;
  category?: string;
};

type MedicationSectionProps = {
  items: MedicationItem[];
  onAdd: (item: Omit<MedicationItem, "id">) => void;
  onRemove: (id: string) => void;
};

function MedicationSection({ items, onAdd, onRemove }: MedicationSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    dose: "",
    frequency: "",
    type: "",
    compliance: "" as MedicationItem["compliance"],
    sideEffects: "",
    category: "",
  });

  const drugTypes = [
    { value: "antihypertensives", label: "Antihypertensives", icon: <HeartPulse className="h-4 w-4 text-rose-600" /> },
    { value: "antiplatelets", label: "Antiplatelets", icon: <ShieldCheck className="h-4 w-4 text-amber-600" /> },
    { value: "anticoagulants", label: "Anticoagulants", icon: <ShieldCheck className="h-4 w-4 text-orange-600" /> },
    { value: "statins", label: "Statins", icon: <Activity className="h-4 w-4 text-indigo-600" /> },
    { value: "antiarrhythmics", label: "Antiarrhythmics", icon: <HeartPulse className="h-4 w-4 text-purple-600" /> },
    { value: "diuretics", label: "Diuretics", icon: <Droplet className="h-4 w-4 text-cyan-600" /> },
    { value: "diabetes_medications", label: "Diabetes medications", icon: <Pill className="h-4 w-4 text-emerald-600" /> },
  ];

  const handleAdd = () => {
    if (!newMed.name.trim() || !newMed.dose.trim() || !newMed.frequency.trim() || !newMed.type) return;
    onAdd({ ...newMed });
    setNewMed({
      name: "",
      dose: "",
      frequency: "",
      type: "",
      compliance: "",
      sideEffects: "",
      category: "",
    });
    setShowAdd(false);
  };

  const getDrugIcon = (type: string) => {
    const dt = drugTypes.find((d) => d.value === type);
    return dt?.icon || <Pill className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-[#374151]">Current Medications</Label>
        <Button
          type="button"
          onClick={() => setShowAdd(true)}
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" /> Add Medication
        </Button>
      </div>

      {items.length === 0 && !showAdd ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#E8E6E0]/40 bg-[#F9F8F5] p-3 text-[#6B7870]">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">No medications recorded</span>
        </div>
      ) : null}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((med) => (
            <div
              key={med.id}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                    {getDrugIcon(med.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1A1F1E]">{med.name}</p>
                    <p className="text-xs text-[#6B7870]">
                      {drugTypes.find((d) => d.value === med.type)?.label} • {med.dose}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#1A5345]">{med.frequency}</p>
                    {med.compliance ? (
                      <p className="mt-1 text-xs text-[#6B7870]">
                        Compliance:{" "}
                        <span className="font-medium text-[#1A1A2E]">
                          {med.compliance === "good" ? "Good" : "Poor"}
                        </span>
                      </p>
                    ) : null}
                    {med.sideEffects?.trim() ? (
                      <p className="mt-1 text-xs text-[#6B7870]">
                        Side effects: <span className="text-gray-600">{med.sideEffects}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(med.id)}
                  className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="rounded-xl rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5] to-transparent p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#1A1F1E]">Add New Medication</h4>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewMed({
                  name: "",
                  dose: "",
                  frequency: "",
                  type: "",
                  compliance: "",
                  sideEffects: "",
                  category: "",
                });
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Medication name"
                value={newMed.name}
                onChange={(e) => setNewMed((p) => ({ ...p, name: e.target.value }))}
                className={REGISTER_INPUT}
              />
              <NativeSelect
                value={newMed.type}
                onChange={(value) => setNewMed((p) => ({ ...p, type: value }))}
                placeholder="Drug type"
                className={REGISTER_INPUT}
                options={[
                  { value: "antihypertensives", label: "Antihypertensives" },
                  { value: "antiplatelets", label: "Antiplatelets" },
                  { value: "anticoagulants", label: "Anticoagulants" },
                  { value: "statins", label: "Statins" },
                  { value: "antiarrhythmics", label: "Antiarrhythmics" },
                  { value: "diuretics", label: "Diuretics" },
                  { value: "diabetes_medications", label: "Diabetes medications" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Dose (e.g. 10mg)"
                value={newMed.dose}
                onChange={(e) => setNewMed((p) => ({ ...p, dose: e.target.value }))}
                className={REGISTER_INPUT}
              />
              <NativeSelect
                value={newMed.frequency}
                onChange={(value) => setNewMed((p) => ({ ...p, frequency: value }))}
                placeholder="Frequency"
                className={REGISTER_INPUT}
                options={[
                  { value: "once-daily", label: "Once daily" },
                  { value: "twice-daily", label: "Twice daily" },
                  { value: "three-times-daily", label: "Three times daily" },
                  { value: "four-times-daily", label: "Four times daily" },
                  { value: "every-4-hours", label: "Every 4 hours" },
                  { value: "every-6-hours", label: "Every 6 hours" },
                  { value: "every-8-hours", label: "Every 8 hours" },
                  { value: "every-12-hours", label: "Every 12 hours" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "as-needed", label: "As needed (PRN)" },
                  { value: "other", label: "Other" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <NativeSelect
                value={newMed.compliance}
                onChange={(value) =>
                  setNewMed((p) => ({
                    ...p,
                    compliance: value === "good" || value === "poor" ? value : "",
                  }))
                }
                placeholder="Compliance (optional)"
                className={REGISTER_INPUT}
                options={[
                  { value: "good", label: "Compliance — good" },
                  { value: "poor", label: "Compliance — poor" },
                ]}
              />
              <Input
                placeholder="Side effects experienced (optional)"
                value={newMed.sideEffects}
                onChange={(e) => setNewMed((p) => ({ ...p, sideEffects: e.target.value }))}
                className={REGISTER_INPUT}
              />
            </div>

            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newMed.name.trim() || !newMed.dose.trim() || !newMed.frequency.trim() || !newMed.type}
              className="h-10 w-full bg-[#1A5345] text-sm font-medium text-white hover:bg-[#154434]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Medication
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type FamilyMember = {
  id: string;
  relationship: string;
  condition: string;
  details?: string;
};

type FamilyHistorySectionProps = {
  items: FamilyMember[];
  onAdd: (item: Omit<FamilyMember, "id">) => void;
  onRemove: (id: string) => void;
};

function FamilyHistorySection({ items, onAdd, onRemove }: FamilyHistorySectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ relationship: "", condition: "", details: "" });

  const relationships = [
    { value: "Mother", label: "Mother" },
    { value: "Father", label: "Father" },
    { value: "Sibling", label: "Sibling" },
    { value: "Sister", label: "Sister" },
    { value: "Brother", label: "Brother" },
    { value: "Grandmother", label: "Grandmother" },
    { value: "Grandfather", label: "Grandfather" },
    { value: "Aunt", label: "Aunt" },
    { value: "Uncle", label: "Uncle" },
    { value: "Daughter", label: "Daughter" },
    { value: "Son", label: "Son" },
    { value: "Cousin", label: "Cousin" },
    { value: "Other", label: "Other" },
  ];

  const handleAdd = () => {
    if (!newMember.relationship.trim() || !newMember.condition.trim()) return;
    onAdd({ ...newMember });
    setNewMember({ relationship: "", condition: "", details: "" });
    setShowAdd(false);
  };

  const getRelationshipIcon = (rel: string) => {
    const isFemale = ["Mother", "Sister", "Grandmother", "Aunt", "Daughter"].includes(rel);
    const isMale = ["Father", "Brother", "Grandfather", "Uncle", "Son"].includes(rel);
    if (isFemale) return <User className="h-4 w-4 text-pink-500" />;
    if (isMale) return <User className="h-4 w-4 text-blue-500" />;
    return <Users className="h-4 w-4 text-purple-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-[#374151]">Family Members</Label>
        <Button
          type="button"
          onClick={() => setShowAdd(true)}
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" /> Add Family Member
        </Button>
      </div>

      {items.length === 0 && !showAdd ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#E8E6E0]/40 bg-[#F9F8F5] p-3 text-[#6B7870]">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">No family history recorded</span>
        </div>
      ) : null}

      {items.length > 0 && (
        <div className="space-y-3">
          {items.map((member) => (
            <div
              key={member.id}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
                    {getRelationshipIcon(member.relationship)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#1A1F1E]">{member.relationship}</p>
                    <p className="text-xs text-[#6B7870]">{member.condition}</p>
                    {member.details && (
                      <p className="mt-1 text-xs text-gray-400">{member.details}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(member.id)}
                  className="shrink-0 rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-[#1A1F1E]">Add Family Member</h4>
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setNewMember({ relationship: "", condition: "", details: "" });
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <NativeSelect
                value={newMember.relationship}
                onChange={(value) => setNewMember((p) => ({ ...p, relationship: value }))}
                placeholder="Relationship"
                className={REGISTER_INPUT}
                options={relationships}
              />
              <Input
                placeholder="Condition (e.g. Diabetes)"
                value={newMember.condition}
                onChange={(e) => setNewMember((p) => ({ ...p, condition: e.target.value }))}
                className={REGISTER_INPUT}
              />
            </div>
            <Input
              placeholder="Additional details (optional)"
              value={newMember.details}
              onChange={(e) => setNewMember((p) => ({ ...p, details: e.target.value }))}
              className={REGISTER_INPUT}
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newMember.relationship.trim() || !newMember.condition.trim()}
              className="h-10 w-full bg-[#1A5345] text-sm font-medium text-white hover:bg-[#154434]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Family Member
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type AllergyItem = {
  id: string;
  allergen: string;
  reaction: string;
};

type AllergySectionProps = {
  title: string;
  icon: React.ReactNode;
  items: AllergyItem[];
  onAdd: (item: Omit<AllergyItem, "id">) => void;
  onRemove: (id: string) => void;
  placeholder: string;
};

function AllergySection({ title, icon, items, onAdd, onRemove, placeholder }: AllergySectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newAllergen, setNewAllergen] = useState("");
  const [newReaction, setNewReaction] = useState("");

  const handleAdd = () => {
    if (!newAllergen.trim()) return;
    onAdd({ allergen: newAllergen.trim(), reaction: newReaction.trim() });
    setNewAllergen("");
    setNewReaction("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-[#374151]">{title}</span>
        </div>
        <Button
          type="button"
          onClick={() => setShowAdd(true)}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm transition-colors hover:border-gray-300"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#374151]">{item.allergen}</span>
                {item.reaction && (
                  <span className="text-xs text-[#6B7870]">Reaction: {item.reaction}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="ml-1 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
          <div className="space-y-2">
            <Input
              placeholder={placeholder}
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              className="h-9 bg-white"
            />
            <Input
              placeholder="Reaction type (optional)"
              value={newReaction}
              onChange={(e) => setNewReaction(e.target.value)}
              className="h-9 bg-white"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleAdd}
                disabled={!newAllergen.trim()}
                size="sm"
                className="h-8 bg-[#1A5345] text-white hover:bg-[#154434]"
              >
                Add
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewAllergen("");
                  setNewReaction("");
                }}
                variant="ghost"
                size="sm"
                className="h-8"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !showAdd && (
        <p className="text-sm italic text-gray-400">No {title.toLowerCase()} recorded</p>
      )}
    </div>
  );
}

export function Step4MedicalHistory({
  medicalValues,
  medicalStepErrors,
  onFieldChange,
  onPrevious,
  onNext,
}: Step4MedicalHistoryProps) {
  const familySaveResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (familySaveResetRef.current) clearTimeout(familySaveResetRef.current);
    };
  }, []);

  const healthData = (medicalValues ?? {}) as Record<string, unknown>;
  function v<T>(key: string, fallback: T): T;
  function v(key: string): unknown;
  function v<T>(key: string, fallback?: T) {
    return (healthData[key] ?? fallback) as unknown as T;
  }
  const arr = <T,>(key: string): T[] =>
    Array.isArray(healthData[key]) ? (healthData[key] as T[]) : [];
  const complaintIs = (value: string) => String(v("chiefComplaint") ?? "") === value;
  const setField = (field: string, value: unknown) => onFieldChange(field, value);

  function handleComplaintChange(nextComplaint: string) {
    const prevComplaint = v("chiefComplaint") as string;

    // Reset all HPI fields for the previous complaint
    if (prevComplaint && prevComplaint !== nextComplaint) {
      const fieldsToReset =
        (COMPLAINT_HPI_FIELDS as Record<string, readonly string[]>)[prevComplaint] ?? [];
      for (const field of fieldsToReset) {
        onFieldChange(field, HPI_ARRAY_FIELDS.has(field) ? [] : "");
      }
      // Also reset "otherComplaint" if switching away from "other"
      if (prevComplaint === "other") {
        onFieldChange("otherComplaint", "");
      }
    }

    setField("chiefComplaint", nextComplaint);
  }

  const toggleArray = (field: string, value: string) => {
    const current = arr<string>(field);
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    setField(field, next);
  };
  const toggleDyspneaRelation = (_field: string, id: string) => {
    const current = arr("dyspneaRelationTo") as string[];
    if (id === "none") {
      setField("dyspneaRelationTo", current.includes("none") ? [] : ["none"]);
      return;
    }
    const withoutNone = current.filter((x: string) => x !== "none");
    const next = withoutNone.includes(id)
      ? withoutNone.filter((x: string) => x !== id)
      : [...withoutNone, id];
    setField("dyspneaRelationTo", next);
  };

  const hpiB = { v, arr, setField, toggleArray };

  // remove unused familySaveResetRef usage
  void familySaveResetRef;

  // Medication helpers (typed; used by MedicationSection callbacks below)
  const addMedication = (item: Omit<MedicationItem, "id">) => {
    const current = arr<MedicationItem>("medications");
    setField("medications", [...current, { ...item, id: crypto.randomUUID() }]);
  };
  const removeMedication = (id: string) => {
    setField(
      "medications",
      arr<MedicationItem>("medications").filter((med) => med.id !== id)
    );
  };

  return (
    <div className="flex flex-col gap-6">
        <div className={`order-1 ${REGISTER_SECTION_CARD}`}>
          <div className="mb-4 flex items-center gap-1">
            <RegisterSectionHeader icon={Stethoscope} label="Current chief complaint" />
            <span className="text-sm font-bold text-[#E15C5C]">*</span>
          </div>

          <div className="space-y-2">
            <NativeSelect
              value={String(v("chiefComplaint") ?? "")}
              onChange={(value) => handleComplaintChange(value)}
              placeholder="Select primary complaint"
              aria-invalid={Boolean(medicalStepErrors.chiefComplaint)}
              className={medicalStepErrors.chiefComplaint ? "border-destructive" : ""}
              options={[
                { value: "chest-pain", label: "Chest pain" },
                { value: "dyspnea", label: "Dyspnea" },
                { value: "palpitations", label: "Palpitations" },
                { value: "syncope", label: "Syncope / presyncope" },
                { value: "leg-swelling", label: "Leg swelling (edema)" },
                { value: "fatigue", label: "Fatigue / exercise intolerance" },
                { value: "constitutional-infective", label: "Constitutional / infective symptoms" },
                { value: "peripheral-vascular", label: "Peripheral vascular symptoms" },
                { value: "hepatic-congestion", label: "Hepatic / abdominal congestion" },
                { value: "jaundice", label: "Jaundice" },
                { value: "cyanosis", label: "Cyanosis" },
                { value: "systemic-embolization", label: "Systemic embolization symptoms" },
                { value: "neurological", label: "Neurological symptoms" },
                { value: "other", label: "Other" },
              ]}
            />
            {medicalStepErrors.chiefComplaint ? (
              <p className="text-sm text-[#E15C5C]" role="alert">
                {medicalStepErrors.chiefComplaint}
              </p>
            ) : null}
          </div>

          {complaintIs("other") ? (
            <div className="mt-3 space-y-2">
              <Label className="text-sm font-medium text-[#374151]">
                Describe your complaint <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Specify your complaint"
                value={String(v("otherComplaint") ?? "")}
                onChange={(e) => setField("otherComplaint", e.target.value)}
                className="h-9"
                aria-invalid={Boolean(medicalStepErrors.chiefComplaint && !String(v("otherComplaint")).trim())}
              />
            </div>
          ) : null}
        </div>

        <div className="order-2 flex flex-col gap-6">
          {complaintIs("chest-pain") ? (
            <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
              <RegisterSectionHeader icon={HeartPulse} label="Chest pain details (OPQRST)" />

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#374151]">Onset — date</Label>
                    <Input
                      type="date"
                      value={String(v("chestPainOnsetDate") ?? "")}
                      onChange={(e) => setField("chestPainOnsetDate", e.target.value)}
                      className={REGISTER_INPUT}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#374151]">Onset</Label>
                    <NativeSelect
                      value={String(v("chestPainOnsetType") ?? "")}
                      onChange={(val) => setField("chestPainOnsetType", val)}
                      placeholder="Sudden / Gradual"
                      className={REGISTER_INPUT}
                      options={[
                        { value: "sudden", label: "Sudden" },
                        { value: "gradual", label: "Gradual" },
                      ]}
                    />
                  </div>
                </div>

                <ChipMultiField
                  label="Provoking factors"
                  field="chestPainProvoking"
                  options={CHEST_PAIN_PROVOKING}
                  selectedIds={arr<string>("chestPainProvoking")}
                  onToggle={toggleArray}
                />

                <ChipMultiField
                  label="Quality"
                  field="chestPainQuality"
                  options={CHEST_PAIN_QUALITY}
                  selectedIds={arr<string>("chestPainQuality")}
                  onToggle={toggleArray}
                />

                <div className="space-y-2 sm:max-w-md">
                  <Label className="text-sm font-medium text-[#374151]">Radiation</Label>
                  <NativeSelect
                    value={String(v("chestPainRadiation") ?? "")}
                    onChange={(val) => setField("chestPainRadiation", val)}
                    placeholder="Select radiation"
                    className={REGISTER_INPUT}
                    options={[...CHEST_PAIN_RADIATION]}
                  />
                </div>

                <SeverityDotScale
                  idPrefix="chest-pain"
                  value={String(v("chestPainSeverity") ?? "")}
                  onChange={(next) => setField("chestPainSeverity", next)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#374151]">Timing</Label>
                    <NativeSelect
                      value={String(v("chestPainTimingPattern") ?? "")}
                      onChange={(val) => setField("chestPainTimingPattern", val)}
                      placeholder="Continuous / Intermittent"
                      className={REGISTER_INPUT}
                      options={[
                        { value: "continuous", label: "Continuous" },
                        { value: "intermittent", label: "Intermittent" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#374151]">Duration</Label>
                    <Input
                      placeholder="e.g. 20 minutes, 2 hours"
                      value={String(v("chestPainTimingDuration") ?? "")}
                      onChange={(e) => setField("chestPainTimingDuration", e.target.value)}
                      className={REGISTER_INPUT}
                    />
                  </div>
                </div>

                <ChipMultiField
                  label="Relieving factors"
                  field="chestPainRelieving"
                  options={CHEST_PAIN_RELIEVING}
                  selectedIds={arr<string>("chestPainRelieving")}
                  onToggle={toggleArray}
                />

                <ChipMultiField
                  label="Associated symptoms"
                  field="chestPainAssociated"
                  options={CHEST_PAIN_ASSOCIATED}
                  selectedIds={arr<string>("chestPainAssociated")}
                  onToggle={toggleArray}
                />
              </div>
            </div>
          ) : null}

          {complaintIs("dyspnea") ? (
            <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
              <RegisterSectionHeader icon={Activity} label="Dyspnea details" />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#374151]">Onset & progression</Label>
                  <Textarea
                    placeholder="Describe onset and how symptoms changed over time"
                    value={String(v("dyspneaOnsetProgression") ?? "")}
                    onChange={(e) => setField("dyspneaOnsetProgression", e.target.value)}
                    className="min-h-[88px] resize-y bg-white"
                  />
                </div>

                <NyhaSegmented
                  value={String(v("dyspneaNYHA") ?? "")}
                  onChange={(val) => setField("dyspneaNYHA", val)}
                />

                <YesNoToggle
                  label="Orthopnea"
                  name="dyspnea-orthopnea"
                  value={String(v("dyspneaOrthopnea") ?? "")}
                  onChange={(next) => {
                    setField("dyspneaOrthopnea", next);
                    if (next !== "yes") setField("dyspneaOrthopneaPillows", "");
                  }}
                />
                {String(v("dyspneaOrthopnea") ?? "") === "yes" ? (
                  <PillowStepper
                    value={String(v("dyspneaOrthopneaPillows") ?? "")}
                    onChange={(val) => setField("dyspneaOrthopneaPillows", val)}
                  />
                ) : null}

                <YesNoToggle
                  label="Paroxysmal nocturnal dyspnea"
                  name="dyspnea-pnd"
                  value={String(v("dyspneaPND") ?? "")}
                  onChange={(val) => setField("dyspneaPND", val)}
                />

                <YesNoToggle
                  label="Wheezing"
                  name="dyspnea-wheeze"
                  value={String(v("dyspneaWheezing") ?? "")}
                  onChange={(val) => setField("dyspneaWheezing", val)}
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#374151]">Cough</Label>
                  <NativeSelect
                    value={String(v("dyspneaCough") ?? "")}
                    onChange={(val) => {
                      setField("dyspneaCough", val);
                      if (val !== "productive") {
                        setField("dyspneaProductiveColor", "");
                        setField("dyspneaProductiveAmount", "");
                      }
                    }}
                    placeholder="Select cough type"
                    className={REGISTER_INPUT}
                    options={[
                      { value: "none", label: "None" },
                      { value: "dry", label: "Dry" },
                      { value: "productive", label: "Productive" },
                    ]}
                  />
                </div>

                {String(v("dyspneaCough") ?? "") === "productive" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#374151]">Sputum color</Label>
                      <NativeSelect
                        value={String(v("dyspneaProductiveColor") ?? "")}
                        onChange={(val) => setField("dyspneaProductiveColor", val)}
                        placeholder="Color"
                        className={REGISTER_INPUT}
                        options={[...DYSPNEA_COUGH_PRODUCTIVE_COLOR]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#374151]">Amount</Label>
                      <NativeSelect
                        value={String(v("dyspneaProductiveAmount") ?? "")}
                        onChange={(val) => setField("dyspneaProductiveAmount", val)}
                        placeholder="Amount"
                        className={REGISTER_INPUT}
                        options={[...DYSPNEA_COUGH_PRODUCTIVE_AMOUNT]}
                      />
                    </div>
                  </div>
                ) : null}

                <YesNoToggle
                  label="Hemoptysis"
                  name="dyspnea-hemoptysis"
                  value={String(v("dyspneaHemoptysis") ?? "")}
                  onChange={(val) => setField("dyspneaHemoptysis", val)}
                />

                <ChipMultiField
                  label="Relation to"
                  field="dyspneaRelationTo"
                  options={DYSPNEA_RELATION}
                  selectedIds={arr<string>("dyspneaRelationTo")}
                  onToggle={toggleDyspneaRelation}
                  tone="blue"
                />
              </div>
            </div>
          ) : null}

          {complaintIs("palpitations") ? <PalpitationsHpi b={hpiB} /> : null}

          {complaintIs("syncope") ? <SyncopeHpi b={hpiB} /> : null}

          {complaintIs("leg-swelling") ? <EdemaHpi b={hpiB} /> : null}

          {complaintIs("fatigue") ? <FatigueHpi b={hpiB} /> : null}

          {complaintIs("constitutional-infective") ? <ConstitutionalHpi b={hpiB} /> : null}

          {complaintIs("peripheral-vascular") ? <PeripheralVascularHpi b={hpiB} /> : null}

          {complaintIs("hepatic-congestion") ? <HepaticCongestionHpi b={hpiB} /> : null}

          {complaintIs("jaundice") ? <JaundiceHpi b={hpiB} /> : null}

          {complaintIs("cyanosis") ? <CyanosisHpi b={hpiB} /> : null}

          {complaintIs("systemic-embolization") ? <EmbolizationHpi b={hpiB} /> : null}

          {complaintIs("neurological") ? <NeurologicalHpi b={hpiB} /> : null}
        </div>

        <div className="order-3">
          <PastMedicalHistoryTabs
            getValue={(field) => String(v(field) ?? "")}
            onSelect={(field, val) => setField(field, val)}
            isNoCardiacHistory={Boolean(v("noCardiacHistory", false))}
            isNoNonCardiacHistory={Boolean(v("noNonCardiacHistory", false))}
            onToggleNoCardiacHistory={() => setField("noCardiacHistory", !Boolean(v("noCardiacHistory", false)))}
            onToggleNoNonCardiacHistory={() => setField("noNonCardiacHistory", !Boolean(v("noNonCardiacHistory", false)))}
          />
        </div>

        <div className={`order-4 ${REGISTER_SECTION_CARD}`}>
          <RegisterSectionHeader icon={Syringe} label="Past interventions / procedures" className="mb-2" />
          <PastInterventionsSection
            value={v("pastInterventions")}
            onChange={(next) => setField("pastInterventions", next)}
          />
        </div>

        <div className={`order-5 ${REGISTER_SECTION_CARD}`}>
          <RegisterSectionHeader icon={Activity} label="Cardiovascular risk factors" />
          {[
            ["riskHypertension", "Hypertension"],
            ["riskDiabetes", "Diabetes Mellitus"],
            ["riskDyslipidemia", "Dyslipidemia"],
            ["riskObesity", "Obesity"],
            ["riskSedentary", "Sedentary lifestyle"],
          ].map(([field, label]) => (
            <div key={field} className="flex items-center justify-between border-b border-[#E8E6E0]/40 py-2">
              <span className="text-sm font-medium text-[#374151]">{label}</span>
              <ChoiceButtons options={["No", "Yes"]} value={String(v(field))} onClick={(val) => setField(field, val)} />
            </div>
          ))}
        </div>

        <div className={`order-6 ${REGISTER_SECTION_CARD}`}>
          <div className="flex items-center justify-between">
            <RegisterSectionHeader icon={Users} label="Family medical history" />
            <div className="flex gap-1">
              {["No", "Yes"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setField("hasFamilyHistory", option === "Yes")}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                    Boolean(v("hasFamilyHistory", false)) === (option === "Yes")
                      ? option === "Yes"
                        ? "border-[#1A5345] bg-[#1A5345] text-white shadow-sm"
                        : "border-[#E8E6E0] bg-[#F4F3ED] text-[#1A1F1E]"
                      : "border-[#E8E6E0] bg-white text-[#6B7870] hover:border-[#A8C4BC]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {v("hasFamilyHistory", false) ? (
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <FamilyHistorySection
                items={arr<FamilyMember>("familyHistory")}
                onAdd={(item) =>
                  setField("familyHistory", [
                    ...arr<FamilyMember>("familyHistory"),
                    { ...item, id: crypto.randomUUID() },
                  ])
                }
                onRemove={(id) =>
                  setField(
                    "familyHistory",
                    arr<FamilyMember>("familyHistory").filter((m) => m.id !== id)
                  )
                }
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-[#E8E6E0]/40 bg-[#F9F8F5] p-3 text-[#6B7870]">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">No significant family medical history reported</span>
            </div>
          )}
        </div>

        <div className={`order-7 ${REGISTER_SECTION_CARD}`}>
          <RegisterSectionHeader icon={ShieldCheck} label="Current medications & allergies" />

          <MedicationSection
            items={arr<MedicationItem>("medications")}
            onAdd={addMedication}
            onRemove={removeMedication}
          />

          <div className="space-y-6 border-t border-gray-100 pt-4">
            <AllergySection
              title="Drug Allergies"
              icon={<Pill className="h-4 w-4 text-red-500" />}
              items={arr<AllergyItem>("drugAllergies")}
              onAdd={(item) =>
                setField("drugAllergies", [
                  ...arr<AllergyItem>("drugAllergies"),
                  { ...item, id: crypto.randomUUID() },
                ])
              }
              onRemove={(id) =>
                setField(
                  "drugAllergies",
                  arr<AllergyItem>("drugAllergies").filter((a) => a.id !== id)
                )
              }
              placeholder="e.g. Penicillin"
            />

            <AllergySection
              title="Food Allergies"
              icon={<AlertCircle className="h-4 w-4 text-amber-500" />}
              items={arr<AllergyItem>("foodAllergies")}
              onAdd={(item) =>
                setField("foodAllergies", [
                  ...arr<AllergyItem>("foodAllergies"),
                  { ...item, id: crypto.randomUUID() },
                ])
              }
              onRemove={(id) =>
                setField(
                  "foodAllergies",
                  arr<AllergyItem>("foodAllergies").filter((a) => a.id !== id)
                )
              }
              placeholder="e.g. Peanuts, Shellfish"
            />

            <AllergySection
              title="Other Allergies"
              icon={<ShieldCheck className="h-4 w-4 text-blue-500" />}
              items={arr<AllergyItem>("otherAllergies")}
              onAdd={(item) =>
                setField("otherAllergies", [
                  ...arr<AllergyItem>("otherAllergies"),
                  { ...item, id: crypto.randomUUID() },
                ])
              }
              onRemove={(id) =>
                setField(
                  "otherAllergies",
                  arr<AllergyItem>("otherAllergies").filter((a) => a.id !== id)
                )
              }
              placeholder="e.g. Latex, Dust mites"
            />

            {arr("drugAllergies").length === 0 && arr("foodAllergies").length === 0 && arr("otherAllergies").length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#E8E6E0]/40 bg-[#F9F8F5] p-3 text-[#6B7870]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">No known allergies reported</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="order-8 flex w-full gap-4 pt-6">
          <Button type="button" onClick={onPrevious} variant="outline" className={REGISTER_OUTLINE_BTN}>
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button type="button" onClick={onNext} className={REGISTER_PRIMARY_BTN}>
            <span className="flex items-center gap-2">
              Continue
              <ChevronRight className="h-5 w-5" />
            </span>
          </Button>
        </div>
    </div>
  );
}
