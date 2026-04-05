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
  Package,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
  Syringe,
  User,
  Users,
  Wind,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

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
import { useRegisterContext } from "./register.context";
import {
  ChipMultiField,
  MedicalNativeSelect as NativeSelect,
  NyhaSegmented,
  PillowStepper,
  SeverityDotScale,
  YesNoToggle,
} from "./registerMedicalUi";

const FAMILY_RELATIONSHIP_OPTIONS = [
  { value: "Mother", label: "Mother" },
  { value: "Father", label: "Father" },
  { value: "Parent", label: "Parent" },
  { value: "Sister", label: "Sister" },
  { value: "Brother", label: "Brother" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Grandmother", label: "Grandmother" },
  { value: "Grandfather", label: "Grandfather" },
  { value: "Aunt", label: "Aunt" },
  { value: "Uncle", label: "Uncle" },
  { value: "Cousin", label: "Cousin" },
  { value: "Spouse", label: "Spouse" },
  { value: "Partner", label: "Partner" },
  { value: "Other", label: "Other" },
] as const;

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

function ChoiceButtons({
  options,
  value,
  onClick,
}: {
  options: string[];
  value: string;
  onClick: (next: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((option) => (
        <button
          type="button"
          key={option}
          onClick={() => onClick(option)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            value === option
              ? option === "Yes"
                ? "border-red-300 bg-red-100 text-red-700"
                : option === "No"
                  ? "border-green-300 bg-green-100 text-green-700"
                  : "border-amber-300 bg-amber-100 text-amber-700"
              : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function Step4MedicalHistory() {
  const { medicalValues, onFieldChange, previousStep, nextStep, medicalStepErrors } = useRegisterContext();
  const familySaveResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [familyProfileSaveStatus, setFamilyProfileSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [familyProfileSaveError, setFamilyProfileSaveError] = useState<string | null>(null);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [newMedication, setNewMedication] = useState({
    name: "",
    dose: "",
    frequency: "",
    type: "",
    category: "",
  });

  useEffect(() => {
    return () => {
      if (familySaveResetRef.current) clearTimeout(familySaveResetRef.current);
    };
  }, []);

  const healthData = (medicalValues ?? {}) as Record<string, any>;
  const v = (key: string, fallback: any = "") => (healthData[key] ?? fallback) as any;
  const arr = (key: string) => (Array.isArray(healthData[key]) ? healthData[key] : []);
  const complaintIs = (value: string) => v("chiefComplaint") === value;
  const setField = (field: string, value: unknown) => onFieldChange(field, value);
  const toggleArray = (field: string, value: string) => {
    const current = arr(field);
    const next = current.includes(value) ? current.filter((item: string) => item !== value) : [...current, value];
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
  const addFamilyMember = () => {
    const family = arr("familyHistory");
    setField("familyHistory", [
      ...family,
      { id: crypto.randomUUID(), relationship: "", condition: "", details: "", hasCondition: true, ageAtDiagnosis: "" },
    ]);
  };
  const removeFamilyMember = (id: string) => {
    setField(
      "familyHistory",
      arr("familyHistory").filter((member: any) => member.id !== id)
    );
  };
  const updateFamily = (id: string, field: string, value: string | boolean) => {
    setField(
      "familyHistory",
      arr("familyHistory").map((member: any) => (member.id === id ? { ...member, [field]: value } : member))
    );
  };

  function saveFamilyMemberProfiles() {
    if (familySaveResetRef.current) {
      clearTimeout(familySaveResetRef.current);
      familySaveResetRef.current = null;
    }
    setFamilyProfileSaveError(null);

    const members = arr("familyHistory") as Array<{
      id: string;
      relationship?: string;
      condition?: string;
    }>;

    if (members.length === 0) {
      setFamilyProfileSaveStatus("error");
      setFamilyProfileSaveError('Add a family member first using “Add Family Member”.');
      return;
    }

    const incomplete = members.some(
      (m) => !String(m.relationship ?? "").trim() || !String(m.condition ?? "").trim()
    );
    if (incomplete) {
      setFamilyProfileSaveStatus("error");
      setFamilyProfileSaveError("Select a relationship and enter a condition for each family member.");
      return;
    }

    setFamilyProfileSaveStatus("success");
    familySaveResetRef.current = setTimeout(() => {
      setFamilyProfileSaveStatus("idle");
      familySaveResetRef.current = null;
    }, 3200);
  }
  const getDrugIcon = (type: string) => {
    switch (type) {
      case "tablet":
      case "sublingual":
        return <Pill className="h-4 w-4 text-blue-500" />;
      case "capsule":
      case "transdermal":
        return <Package className="h-4 w-4 text-purple-500" />;
      case "injection":
      case "intravenous":
        return <Syringe className="h-4 w-4 text-red-500" />;
      case "inhaler":
        return <Wind className="h-4 w-4 text-green-500" />;
      case "syrup":
        return <Droplet className="h-4 w-4 text-orange-500" />;
      default:
        return <Pill className="h-4 w-4 text-gray-500" />;
    }
  };
  const getDrugTypeName = (type: string) => {
    switch (type) {
      case "tablet":
        return "Tablet";
      case "capsule":
        return "Capsule";
      case "sublingual":
        return "Sublingual tablet";
      case "injection":
        return "Injection";
      case "intravenous":
        return "Intravenous (IV)";
      case "transdermal":
        return "Transdermal patch";
      case "inhaler":
        return "Inhaler";
      case "syrup":
        return "Syrup";
      default:
        return type;
    }
  };
  const addMedication = () => {
    if (!newMedication.name || !newMedication.dose || !newMedication.frequency || !newMedication.type) return;
    setField("medications", [...arr("medications"), { ...newMedication, id: crypto.randomUUID() }]);
    setNewMedication({ name: "", dose: "", frequency: "", type: "", category: "" });
    setShowAddMedication(false);
  };
  const removeMedication = (id: string) => {
    setField(
      "medications",
      arr("medications").filter((med: any) => med.id !== id)
    );
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="order-1 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Stethoscope className="h-4 w-4 text-blue-600" />
            </div>
            <Label className="text-base font-semibold">
              Current chief complaint <span className="text-red-500">*</span>
            </Label>
          </div>

          <div className="space-y-2">
            <NativeSelect
              value={v("chiefComplaint")}
              onChange={(value) => setField("chiefComplaint", value)}
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
              <p className="text-sm text-destructive" role="alert">
                {medicalStepErrors.chiefComplaint}
              </p>
            ) : null}
          </div>

          {complaintIs("other") ? (
            <div className="mt-3 space-y-2">
              <Label className="text-sm font-medium text-[#1A1A2E]">
                Describe your complaint <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Specify your complaint"
                value={v("otherComplaint")}
                onChange={(e) => setField("otherComplaint", e.target.value)}
                className="h-9"
                aria-invalid={Boolean(medicalStepErrors.chiefComplaint && !String(v("otherComplaint")).trim())}
              />
            </div>
          ) : null}
        </div>

        <div className="order-2 flex flex-col gap-6">
          {complaintIs("chest-pain") ? (
            <div className="space-y-4 rounded-lg border-l-4 border-l-red-500 bg-red-50/50 p-5">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-[#1A1A2E]">Chest Pain Details (OPQRST)</h3>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1A1A2E]">Onset — date</Label>
                    <Input
                      type="date"
                      value={v("chestPainOnsetDate")}
                      onChange={(e) => setField("chestPainOnsetDate", e.target.value)}
                      className="h-10 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1A1A2E]">Onset</Label>
                    <NativeSelect
                      value={v("chestPainOnsetType")}
                      onChange={(val) => setField("chestPainOnsetType", val)}
                      placeholder="Sudden / Gradual"
                      className="h-10 bg-white"
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
                  selectedIds={arr("chestPainProvoking")}
                  onToggle={toggleArray}
                />

                <ChipMultiField
                  label="Quality"
                  field="chestPainQuality"
                  options={CHEST_PAIN_QUALITY}
                  selectedIds={arr("chestPainQuality")}
                  onToggle={toggleArray}
                />

                <div className="space-y-2 sm:max-w-md">
                  <Label className="text-sm font-medium text-[#1A1A2E]">Radiation</Label>
                  <NativeSelect
                    value={v("chestPainRadiation")}
                    onChange={(val) => setField("chestPainRadiation", val)}
                    placeholder="Select radiation"
                    className="h-10 bg-white"
                    options={[...CHEST_PAIN_RADIATION]}
                  />
                </div>

                <SeverityDotScale
                  idPrefix="chest-pain"
                  value={v("chestPainSeverity")}
                  onChange={(next) => setField("chestPainSeverity", next)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1A1A2E]">Timing</Label>
                    <NativeSelect
                      value={v("chestPainTimingPattern")}
                      onChange={(val) => setField("chestPainTimingPattern", val)}
                      placeholder="Continuous / Intermittent"
                      className="h-10 bg-white"
                      options={[
                        { value: "continuous", label: "Continuous" },
                        { value: "intermittent", label: "Intermittent" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#1A1A2E]">Duration</Label>
                    <Input
                      placeholder="e.g. 20 minutes, 2 hours"
                      value={v("chestPainTimingDuration")}
                      onChange={(e) => setField("chestPainTimingDuration", e.target.value)}
                      className="h-10 bg-white"
                    />
                  </div>
                </div>

                <ChipMultiField
                  label="Relieving factors"
                  field="chestPainRelieving"
                  options={CHEST_PAIN_RELIEVING}
                  selectedIds={arr("chestPainRelieving")}
                  onToggle={toggleArray}
                />

                <ChipMultiField
                  label="Associated symptoms"
                  field="chestPainAssociated"
                  options={CHEST_PAIN_ASSOCIATED}
                  selectedIds={arr("chestPainAssociated")}
                  onToggle={toggleArray}
                />
              </div>
            </div>
          ) : null}

          {complaintIs("dyspnea") ? (
            <div className="space-y-4 rounded-lg border-l-4 border-l-blue-500 bg-blue-50/50 p-5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-[#1A1A2E]">Dyspnea Details</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1A1A2E]">Onset & progression</Label>
                  <Textarea
                    placeholder="Describe onset and how symptoms changed over time"
                    value={v("dyspneaOnsetProgression")}
                    onChange={(e) => setField("dyspneaOnsetProgression", e.target.value)}
                    className="min-h-[88px] resize-y bg-white"
                  />
                </div>

                <NyhaSegmented value={v("dyspneaNYHA")} onChange={(val) => setField("dyspneaNYHA", val)} />

                <YesNoToggle
                  label="Orthopnea"
                  name="dyspnea-orthopnea"
                  value={v("dyspneaOrthopnea")}
                  onChange={(next) => {
                    setField("dyspneaOrthopnea", next);
                    if (next !== "yes") setField("dyspneaOrthopneaPillows", "");
                  }}
                />
                {v("dyspneaOrthopnea") === "yes" ? (
                  <PillowStepper
                    value={v("dyspneaOrthopneaPillows")}
                    onChange={(val) => setField("dyspneaOrthopneaPillows", val)}
                  />
                ) : null}

                <YesNoToggle
                  label="Paroxysmal nocturnal dyspnea"
                  name="dyspnea-pnd"
                  value={v("dyspneaPND")}
                  onChange={(val) => setField("dyspneaPND", val)}
                />

                <YesNoToggle
                  label="Wheezing"
                  name="dyspnea-wheeze"
                  value={v("dyspneaWheezing")}
                  onChange={(val) => setField("dyspneaWheezing", val)}
                />

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1A1A2E]">Cough</Label>
                  <NativeSelect
                    value={v("dyspneaCough")}
                    onChange={(val) => {
                      setField("dyspneaCough", val);
                      if (val !== "productive") {
                        setField("dyspneaProductiveColor", "");
                        setField("dyspneaProductiveAmount", "");
                      }
                    }}
                    placeholder="Select cough type"
                    className="h-10 bg-white"
                    options={[
                      { value: "none", label: "None" },
                      { value: "dry", label: "Dry" },
                      { value: "productive", label: "Productive" },
                    ]}
                  />
                </div>

                {v("dyspneaCough") === "productive" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#1A1A2E]">Sputum color</Label>
                      <NativeSelect
                        value={v("dyspneaProductiveColor")}
                        onChange={(val) => setField("dyspneaProductiveColor", val)}
                        placeholder="Color"
                        className="h-10 bg-white"
                        options={[...DYSPNEA_COUGH_PRODUCTIVE_COLOR]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#1A1A2E]">Amount</Label>
                      <NativeSelect
                        value={v("dyspneaProductiveAmount")}
                        onChange={(val) => setField("dyspneaProductiveAmount", val)}
                        placeholder="Amount"
                        className="h-10 bg-white"
                        options={[...DYSPNEA_COUGH_PRODUCTIVE_AMOUNT]}
                      />
                    </div>
                  </div>
                ) : null}

                <YesNoToggle
                  label="Hemoptysis"
                  name="dyspnea-hemoptysis"
                  value={v("dyspneaHemoptysis")}
                  onChange={(val) => setField("dyspneaHemoptysis", val)}
                />

                <ChipMultiField
                  label="Relation to"
                  field="dyspneaRelationTo"
                  options={DYSPNEA_RELATION}
                  selectedIds={arr("dyspneaRelationTo")}
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

        <div className="order-3 space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                <HeartPulse className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-[#1A1A2E]">Past Cardiac History</h3>
            </div>
            <button
              type="button"
              onClick={() => setField("noCardiacHistory", !Boolean(v("noCardiacHistory", false)))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
                v("noCardiacHistory", false)
                  ? "border-green-300 bg-green-100 text-green-700"
                  : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {v("noCardiacHistory", false) ? <CheckCircle2 className="h-4 w-4" /> : null}
              No Cardiac History
            </button>
          </div>

          {!v("noCardiacHistory", false) ? (
            <div className="space-y-3">
              {[
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
              ].map(([field, title, subtitle]) => (
                <div key={field} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#1A1A2E]">{title}</span>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                  </div>
                  <ChoiceButtons options={["Yes", "No", "Not sure"]} value={String(v(field))} onClick={(val) => setField(field, val)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Patient reports no significant cardiac history</span>
            </div>
          )}
        </div>

        <div className="order-4 space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <Label className="text-base font-semibold">Past Medical History (Non-Cardiac)</Label>
            </div>
            <button
              type="button"
              onClick={() => setField("noNonCardiacHistory", !Boolean(v("noNonCardiacHistory", false)))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
                v("noNonCardiacHistory", false)
                  ? "border-green-300 bg-green-100 text-green-700"
                  : "border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {v("noNonCardiacHistory", false) ? <CheckCircle2 className="h-4 w-4" /> : null}
              No Non-Cardiac History
            </button>
          </div>

          {!v("noNonCardiacHistory", false) ? (
            <div className="space-y-3">
              {[
                ["pastStroke", "Stroke or TIA", "Brain attack or mini-stroke"],
                ["pastCKD", "Chronic kidney disease", "Long-term kidney problems"],
                ["pastLungDisease", "Chronic lung disease", "COPD, asthma, etc."],
                ["pastThyroid", "Thyroid disease", "Underactive or overactive thyroid"],
                ["pastLiver", "Liver disease", "Hepatitis, cirrhosis, etc."],
                ["pastAnemia", "Anemia", "Low blood count"],
                ["pastAutoimmune", "Autoimmune disease", "Lupus, RA, etc."],
                ["pastMalignancy", "Cancer / malignancy", "Any cancer history"],
                ["pastSleepApnea", "Sleep apnea", "Breathing pauses in sleep"],
              ].map(([field, title, subtitle]) => (
                <div key={field} className="flex items-center justify-between gap-4 border-b border-gray-100 py-3">
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#1A1A2E]">{title}</span>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                  </div>
                  <ChoiceButtons options={["Yes", "No", "Not sure"]} value={String(v(field))} onClick={(val) => setField(field, val)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm">Patient reports no significant non-cardiac medical history</span>
            </div>
          )}
        </div>

        <div className="order-5 space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100">
              <Syringe className="h-4 w-4 text-teal-600" />
            </div>
            <h3 className="font-semibold text-[#1A1A2E]">Past Interventions / Procedures</h3>
          </div>
          <PastInterventionsSection
            value={v("pastInterventions")}
            onChange={(next) => setField("pastInterventions", next)}
          />
        </div>

        <div className="order-6 space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
              <Activity className="h-4 w-4 text-red-600" />
            </div>
            <h3 className="font-semibold text-[#1A1A2E]">Cardiovascular Risk Factors</h3>
          </div>
          {[
            ["riskDiabetes", "Diabetes Mellitus"],
            ["riskDyslipidemia", "Dyslipidemia"],
            ["riskObesity", "Obesity"],
            ["riskSedentary", "Sedentary lifestyle"],
          ].map(([field, label]) => (
            <div key={field} className="flex items-center justify-between border-b border-gray-100 py-2">
              <span className="text-sm font-medium text-[#1A1A2E]">{label}</span>
              <ChoiceButtons options={["No", "Yes"]} value={String(v(field))} onClick={(val) => setField(field, val)} />
            </div>
          ))}
        </div>

        <div className="order-7 space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-[#1A1A2E]">Family Medical History</h3>
            </div>
            <div className="flex gap-1">
              {["No", "Yes"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setField("hasFamilyHistory", option === "Yes")}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                    Boolean(v("hasFamilyHistory", false)) === (option === "Yes")
                      ? option === "Yes"
                        ? "border-purple-300 bg-purple-100 text-purple-700"
                        : "border-gray-300 bg-gray-100 text-gray-700"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {v("hasFamilyHistory", false) ? (
            <div className="space-y-4 border-t border-gray-100 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm italic text-gray-600">Add family members with medical conditions</p>
                <Button type="button" onClick={addFamilyMember} variant="outline" size="sm" className="h-8 px-3 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Add Family Member
                </Button>
              </div>
              {arr("familyHistory").map((member: any) => {
                const rel = String(member.relationship ?? "");
                const relationshipOptions =
                  rel && !FAMILY_RELATIONSHIP_OPTIONS.some((o) => o.value === rel)
                    ? [...FAMILY_RELATIONSHIP_OPTIONS, { value: rel, label: rel }]
                    : FAMILY_RELATIONSHIP_OPTIONS;

                return (
                <div key={member.id} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-semibold text-[#1A1A2E]">Family Member Profile</span>
                    </div>
                    <Button type="button" onClick={() => removeFamilyMember(member.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      value={rel || undefined}
                      onValueChange={(next) => updateFamily(member.id, "relationship", next)}
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg border-input bg-transparent shadow-sm">
                        <SelectValue placeholder="Relationship" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} className="rounded-lg">
                        {relationshipOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Condition"
                      value={member.condition ?? ""}
                      onChange={(e) => updateFamily(member.id, "condition", e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <Input
                    placeholder="Additional details"
                    value={member.details ?? ""}
                    onChange={(e) => updateFamily(member.id, "details", e.target.value)}
                    className="h-10"
                  />
                </div>
                );
              })}
              <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                {familyProfileSaveStatus === "error" && familyProfileSaveError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {familyProfileSaveError}
                  </p>
                ) : familyProfileSaveStatus === "success" ? (
                  <p className="text-sm font-medium text-emerald-600" role="status">
                    Member profiles saved — you can continue when ready.
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Save when relationship and condition are filled for everyone listed.
                  </p>
                )}
                <Button
                  type="button"
                  onClick={saveFamilyMemberProfiles}
                  size="sm"
                  className="h-9 w-full shrink-0 bg-[#2D8B84] text-white hover:bg-[#1F5F5A] sm:w-auto"
                >
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Save member profile
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-gray-500">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm italic">No significant family medical history reported</span>
            </div>
          )}
        </div>

        <div className="order-8 space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-[#1A1A2E]">Current Medications & Allergies</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-[#1A1A2E]">Current Medications</Label>
              <Button type="button" onClick={() => setShowAddMedication(true)} variant="outline" size="sm" className="h-8 px-3 text-xs">
                <Plus className="mr-1 h-3 w-3" /> Add Medication
              </Button>
            </div>

            {arr("medications").length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No medications added</div>
            ) : (
              <div className="space-y-2">
                {arr("medications").map((med: any) => (
                  <div key={med.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div className="flex flex-1 items-center gap-3">
                      {getDrugIcon(med.type)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#1A1A2E]">{med.name}</div>
                        <div className="text-xs text-gray-600">
                          {med.dose} - {med.frequency} • {getDrugTypeName(med.type)}
                        </div>
                      </div>
                    </div>
                    <Button type="button" onClick={() => removeMedication(med.id)} variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showAddMedication ? (
            <div className="space-y-3 rounded-lg border border-[#2D8B84]/20 bg-[#2D8B84]/5 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[#1A1A2E]">Add New Medication</h4>
                <Button type="button" onClick={() => setShowAddMedication(false)} variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3">
                <Input placeholder="Medication name" value={newMedication.name} onChange={(e) => setNewMedication((p) => ({ ...p, name: e.target.value }))} className="h-9" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Dose" value={newMedication.dose} onChange={(e) => setNewMedication((p) => ({ ...p, dose: e.target.value }))} className="h-9" />
                  <Input placeholder="Frequency" value={newMedication.frequency} onChange={(e) => setNewMedication((p) => ({ ...p, frequency: e.target.value }))} className="h-9" />
                </div>
                <NativeSelect
                  value={newMedication.type}
                  onChange={(value) => setNewMedication((p) => ({ ...p, type: value }))}
                  placeholder="Drug type"
                  className="h-9"
                  options={[
                    { value: "tablet", label: "Tablet" },
                    { value: "capsule", label: "Capsule" },
                    { value: "sublingual", label: "Sublingual tablet" },
                    { value: "injection", label: "Injection" },
                    { value: "intravenous", label: "Intravenous (IV)" },
                    { value: "transdermal", label: "Transdermal patch" },
                    { value: "inhaler", label: "Inhaler" },
                    { value: "syrup", label: "Syrup" },
                  ]}
                />
                <Button type="button" onClick={addMedication} disabled={!newMedication.name || !newMedication.dose || !newMedication.frequency || !newMedication.type} className="h-9 w-full bg-[#2D8B84] text-sm text-white hover:bg-[#1F5F5A]">
                  Add Medication
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <Label className="text-sm font-medium text-[#1A1A2E]">Allergies</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Drug allergies" value={v("allergyDrug")} onChange={(e) => setField("allergyDrug", e.target.value)} className="h-9" />
              <Input placeholder="Reaction type" value={v("allergyDrugReaction")} onChange={(e) => setField("allergyDrugReaction", e.target.value)} className="h-9" />
              <Input placeholder="Food allergies" value={v("allergyFood")} onChange={(e) => setField("allergyFood", e.target.value)} className="h-9" />
              <Input placeholder="Other allergies" value={v("allergyOther")} onChange={(e) => setField("allergyOther", e.target.value)} className="h-9" />
              <Input placeholder="Compliance" value={v("drugCompliance")} onChange={(e) => setField("drugCompliance", e.target.value)} className="h-9" />
              <Input placeholder="Side effects experienced" value={v("drugSideEffects")} onChange={(e) => setField("drugSideEffects", e.target.value)} className="h-9" />
            </div>
          </div>
        </div>

        <div className="order-9 space-y-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-[#1A1A2E]">Social History</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <NativeSelect
              value={v("socialRecreationalDrugs")}
              onChange={(val) => setField("socialRecreationalDrugs", val)}
              placeholder="Recreational drugs"
              className="h-9"
              options={[
                { value: "never", label: "Never" },
                { value: "past", label: "Past use" },
                { value: "current", label: "Current use" },
              ]}
            />
            <NativeSelect
              value={v("socialDietSalt")}
              onChange={(val) => setField("socialDietSalt", val)}
              placeholder="Diet - salt"
              className="h-9"
              options={[
                { value: "low", label: "Low salt" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High salt" },
              ]}
            />
            <NativeSelect
              value={v("socialDietFat")}
              onChange={(val) => setField("socialDietFat", val)}
              placeholder="Diet - fat"
              className="h-9"
              options={[
                { value: "low", label: "Low fat" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High fat" },
              ]}
            />
          </div>
        </div>

        <div className="order-10 flex w-full gap-4 pt-6">
          <Button type="button" onClick={previousStep} variant="outline" className="h-12 flex-1 rounded-xl border-2 text-base">
            <ChevronLeft className="mr-2 h-5 w-5" />
            Back
          </Button>
          <Button type="button" onClick={nextStep} className="h-12 flex-1 rounded-xl bg-[#2D8B84] text-base font-medium text-white transition-all duration-300 hover:bg-[#1F5F5A]">
            <span className="flex items-center gap-2">
              Continue
              <ChevronRight className="h-5 w-5" />
            </span>
          </Button>
        </div>
    </div>
  );
}
