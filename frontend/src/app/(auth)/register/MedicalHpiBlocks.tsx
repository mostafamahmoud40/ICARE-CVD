"use client";

import { Activity, AlertCircle, Brain, Footprints, HeartPulse, Moon, Skull, Sun, Wind, Zap } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  ChipMultiField,
  MedicalNativeSelect,
  NyhaSegmented,
  SegmentedField,
  YesNoToggle,
} from "./registerMedicalUi";

export const CHIEF_COMPLAINT_LABELS: Record<string, string> = {
  "chest-pain": "Chest pain",
  dyspnea: "Dyspnea",
  palpitations: "Palpitations",
  syncope: "Syncope / presyncope",
  "leg-swelling": "Leg swelling (edema)",
  fatigue: "Fatigue / exercise intolerance",
  "constitutional-infective": "Constitutional / infective symptoms",
  "peripheral-vascular": "Peripheral vascular symptoms",
  "hepatic-congestion": "Hepatic / abdominal congestion",
  jaundice: "Jaundice",
  cyanosis: "Cyanosis",
  "systemic-embolization": "Systemic embolization symptoms",
  neurological: "Neurological symptoms",
  other: "Other",
};

export type HpiBindings = {
  v: (key: string, fallback?: unknown) => unknown;
  arr: (key: string) => string[];
  setField: (key: string, value: unknown) => void;
  toggleArray: (field: string, id: string) => void;
};

const PALP_TRIGGERS = [
  { id: "exercise", label: "Exercise" },
  { id: "caffeine", label: "Caffeine" },
  { id: "stress", label: "Stress" },
  { id: "spontaneous", label: "Spontaneous" },
] as const;

const PALP_ASSOC = [
  { id: "dizziness", label: "Dizziness" },
  { id: "syncope", label: "Syncope" },
  { id: "chest_pain", label: "Chest pain" },
  { id: "dyspnea", label: "Dyspnea" },
] as const;

export function PalpitationsHpi({ b }: { b: HpiBindings }) {
  const { v, arr, setField, toggleArray } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-pink-600" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Palpitations</h3>
      </div>
      <div className="space-y-4">
        <SegmentedField
          label="Onset"
          value={String(v("palpitationsOnsetType"))}
          onChange={(val) => setField("palpitationsOnsetType", val)}
          options={[
            { value: "sudden", label: "Sudden" },
            { value: "gradual", label: "Gradual" },
          ]}
          accent="pink"
          ariaLabel="Onset type"
        />
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#374151]">Duration</Label>
          <Input
            placeholder="e.g. minutes, hours, constant"
            value={String(v("palpitationsDuration"))}
            onChange={(e) => setField("palpitationsDuration", e.target.value)}
            className="h-10 bg-white"
          />
        </div>
        <SegmentedField
          label="Rhythm"
          value={String(v("palpitationsRhythm"))}
          onChange={(val) => setField("palpitationsRhythm", val)}
          options={[
            { value: "regular", label: "Regular" },
            { value: "irregular", label: "Irregular" },
          ]}
          accent="pink"
        />
        <SegmentedField
          label="Rate"
          value={String(v("palpitationsRate"))}
          onChange={(val) => setField("palpitationsRate", val)}
          options={[
            { value: "fast", label: "Fast" },
            { value: "slow", label: "Slow" },
            { value: "unknown", label: "Unknown" },
          ]}
          accent="pink"
        />
        <ChipMultiField
          label="Triggers"
          field="palpitationsTriggers"
          options={PALP_TRIGGERS}
          selectedIds={arr("palpitationsTriggers")}
          onToggle={toggleArray}
          tone="pink"
        />
        <SegmentedField
          label="Termination"
          value={String(v("palpitationsTermination"))}
          onChange={(val) => setField("palpitationsTermination", val)}
          options={[
            { value: "sudden", label: "Sudden" },
            { value: "gradual", label: "Gradual" },
            { value: "vagal", label: "Vagal maneuvers" },
          ]}
          accent="pink"
        />
        <ChipMultiField
          label="Associated symptoms"
          field="palpitationsAssociated"
          options={PALP_ASSOC}
          selectedIds={arr("palpitationsAssociated")}
          onToggle={toggleArray}
          tone="pink"
        />
      </div>
    </div>
  );
}

const SYNC_CIRC = [
  { id: "exertion", label: "Exertion" },
  { id: "standing", label: "Standing" },
  { id: "emotional_stress", label: "Emotional stress" },
  { id: "at_rest", label: "At rest" },
] as const;

const SYNC_PROD = [
  { id: "nausea", label: "Nausea" },
  { id: "sweating", label: "Sweating" },
  { id: "visual_changes", label: "Visual changes" },
  { id: "palpitations", label: "Palpitations" },
  { id: "none", label: "None" },
] as const;

export function SyncopeHpi({ b }: { b: HpiBindings }) {
  const { v, arr, setField, toggleArray } = b;
  const toggleProdrome = (_f: string, id: string) => {
    const current = arr("syncopeProdrome");
    if (id === "none") {
      setField("syncopeProdrome", current.includes("none") ? [] : ["none"]);
      return;
    }
    const w = current.filter((x) => x !== "none");
    setField(
      "syncopeProdrome",
      w.includes(id) ? w.filter((x) => x !== id) : [...w, id]
    );
  };
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-orange-600" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Syncope / Presyncope</h3>
      </div>
      <div className="space-y-4">
        <ChipMultiField
          label="Circumstances"
          field="syncopeCircumstances"
          options={SYNC_CIRC}
          selectedIds={arr("syncopeCircumstances")}
          onToggle={toggleArray}
          tone="orange"
        />
        <ChipMultiField
          label="Prodrome"
          field="syncopeProdrome"
          options={SYNC_PROD}
          selectedIds={arr("syncopeProdrome")}
          onToggle={toggleProdrome}
          tone="orange"
        />
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#374151]">Duration of LOC</Label>
          <MedicalNativeSelect
            value={String(v("syncopeLocDuration"))}
            onChange={(val) => setField("syncopeLocDuration", val)}
            placeholder="Select duration"
            className="h-10 max-w-md bg-white"
            options={[
              { value: "seconds", label: "Seconds" },
              { value: "lt_1min", label: "< 1 min" },
              { value: "1_5min", label: "1–5 min" },
              { value: "gt_5min", label: "> 5 min" },
              { value: "unknown", label: "Unknown" },
            ]}
          />
        </div>
        <SegmentedField
          label="Recovery"
          value={String(v("syncopeRecovery"))}
          onChange={(val) => setField("syncopeRecovery", val)}
          options={[
            { value: "rapid", label: "Rapid" },
            { value: "prolonged_confusion", label: "Prolonged confusion" },
          ]}
          accent="orange"
        />
        <YesNoToggle
          label="Injury during event"
          name="syncope-injury"
          value={String(v("syncopeInjury"))}
          onChange={(val) => setField("syncopeInjury", val)}
        />
        <YesNoToggle
          label="Previous similar episodes"
          name="syncope-prev"
          value={String(v("syncopePreviousSimilar"))}
          onChange={(val) => {
            setField("syncopePreviousSimilar", val);
            if (val !== "yes") setField("syncopePreviousCount", "");
          }}
        />
        {v("syncopePreviousSimilar") === "yes" ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#374151]">How many episodes?</Label>
            <Input
              type="number"
              min={0}
              placeholder="Approximate count"
              value={String(v("syncopePreviousCount"))}
              onChange={(e) => setField("syncopePreviousCount", e.target.value)}
              className="h-10 max-w-xs bg-white"
            />
          </div>
        ) : null}
        <YesNoToggle
          label="Family history of sudden death"
          name="syncope-fh"
          value={String(v("syncopeFamilySuddenDeath"))}
          onChange={(val) => setField("syncopeFamilySuddenDeath", val)}
        />
      </div>
    </div>
  );
}

const EDEMA_LOC = [
  { id: "ankles", label: "Ankles" },
  { id: "legs", label: "Legs" },
  { id: "sacral", label: "Sacral" },
  { id: "generalized", label: "Generalized" },
] as const;

export function EdemaHpi({ b }: { b: HpiBindings }) {
  const { v, arr, setField, toggleArray } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Footprints className="h-5 w-5 text-cyan-700" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Leg swelling (Edema)</h3>
      </div>
      <div className="space-y-4">
        <ChipMultiField
          label="Location"
          field="edemaLocation"
          options={EDEMA_LOC}
          selectedIds={arr("edemaLocation")}
          onToggle={toggleArray}
          tone="teal"
        />
        <SegmentedField
          label="Symmetry"
          value={String(v("edemaSymmetry"))}
          onChange={(val) => {
            setField("edemaSymmetry", val);
            if (val !== "unilateral") setField("edemaSide", "");
          }}
          options={[
            { value: "bilateral", label: "Bilateral" },
            { value: "unilateral", label: "Unilateral" },
          ]}
          accent="teal"
        />
        {v("edemaSymmetry") === "unilateral" ? (
          <SegmentedField
            label="Side"
            value={String(v("edemaSide"))}
            onChange={(val) => setField("edemaSide", val)}
            options={[
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            accent="teal"
          />
        ) : null}
        <YesNoToggle
          label="Diurnal variation"
          name="edema-diurnal"
          value={String(v("edemaDiurnal"))}
          onChange={(val) => setField("edemaDiurnal", val)}
        />
        <YesNoToggle
          label="Associated weight gain"
          name="edema-wt"
          value={String(v("edemaWeightGain"))}
          onChange={(val) => {
            setField("edemaWeightGain", val);
            if (val !== "yes") setField("edemaWeightGainKg", "");
          }}
        />
        {v("edemaWeightGain") === "yes" ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#374151]">How much (kg)?</Label>
            <Input
              placeholder="e.g. 3"
              value={String(v("edemaWeightGainKg"))}
              onChange={(e) => setField("edemaWeightGainKg", e.target.value)}
              className="h-10 max-w-xs bg-white"
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#374151]">Response to diuretics</Label>
          <MedicalNativeSelect
            value={String(v("edemaDiureticResponse"))}
            onChange={(val) => setField("edemaDiureticResponse", val)}
            placeholder="Select response"
            className="h-10 max-w-md bg-white"
            options={[
              { value: "not_tried", label: "Not tried" },
              { value: "yes_good", label: "Yes — good response" },
              { value: "partial", label: "Partial" },
              { value: "no_response", label: "No response" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

const FATIGUE_ASSOC = [
  { id: "dyspnea", label: "Dyspnea" },
  { id: "chest_pain", label: "Chest pain" },
  { id: "palpitations", label: "Palpitations" },
  { id: "dizziness", label: "Dizziness" },
] as const;

export function FatigueHpi({ b }: { b: HpiBindings }) {
  const { v, arr, setField, toggleArray } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Moon className="h-5 w-5 text-amber-700" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Fatigue / exercise intolerance</h3>
      </div>
      <div className="space-y-4">
        <NyhaSegmented value={String(v("fatigueNYHA"))} onChange={(val) => setField("fatigueNYHA", val)} />
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#374151]">Onset</Label>
          <Textarea
            placeholder="Describe onset"
            value={String(v("fatigueOnset"))}
            onChange={(e) => setField("fatigueOnset", e.target.value)}
            className="min-h-[72px] resize-y bg-white"
          />
        </div>
        <ChipMultiField
          label="Associated symptoms"
          field="fatigueAssociated"
          options={FATIGUE_ASSOC}
          selectedIds={arr("fatigueAssociated")}
          onToggle={toggleArray}
          tone="amber"
        />
      </div>
    </div>
  );
}

export function ConstitutionalHpi({ b }: { b: HpiBindings }) {
  const { v, setField } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-rose-600" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Constitutional / infective</h3>
      </div>
      <div className="space-y-4">
        <YesNoToggle
          label="Fever"
          name="constit-fever"
          value={String(v("constitFever"))}
          onChange={(val) => {
            setField("constitFever", val);
            if (val !== "yes") {
              setField("constitFeverOnsetDate", "");
              setField("constitFeverPattern", "");
            }
          }}
        />
        {v("constitFever") === "yes" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#374151]">Fever onset (date)</Label>
              <Input
                type="date"
                value={String(v("constitFeverOnsetDate"))}
                onChange={(e) => setField("constitFeverOnsetDate", e.target.value)}
                className="h-10 bg-white"
              />
            </div>
            <SegmentedField
              label="Pattern"
              value={String(v("constitFeverPattern"))}
              onChange={(val) => setField("constitFeverPattern", val)}
              options={[
                { value: "continuous", label: "Continuous" },
                { value: "intermittent", label: "Intermittent" },
              ]}
              accent="violet"
            />
          </div>
        ) : null}
        <YesNoToggle label="Chills or rigors" name="constit-chills" value={String(v("constitChills"))} onChange={(val) => setField("constitChills", val)} />
        <YesNoToggle label="Night sweats" name="constit-night" value={String(v("constitNightSweats"))} onChange={(val) => setField("constitNightSweats", val)} />
        <YesNoToggle
          label="Unintentional weight loss"
          name="constit-wl"
          value={String(v("constitWeightLoss"))}
          onChange={(val) => {
            setField("constitWeightLoss", val);
            if (val !== "yes") {
              setField("constitWeightLossAmount", "");
              setField("constitWeightLossTimeframe", "");
            }
          }}
        />
        {v("constitWeightLoss") === "yes" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#374151]">Amount</Label>
              <Input
                placeholder="e.g. 5 kg"
                value={String(v("constitWeightLossAmount"))}
                onChange={(e) => setField("constitWeightLossAmount", e.target.value)}
                className="h-10 bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#374151]">Timeframe</Label>
              <Input
                placeholder="e.g. over 2 months"
                value={String(v("constitWeightLossTimeframe"))}
                onChange={(e) => setField("constitWeightLossTimeframe", e.target.value)}
                className="h-10 bg-white"
              />
            </div>
          </div>
        ) : null}
        <YesNoToggle label="Fatigue / malaise" name="constit-fatigue" value={String(v("constitFatigue"))} onChange={(val) => setField("constitFatigue", val)} />
      </div>
    </div>
  );
}

const PV_SITES = [
  { id: "calf", label: "Calf" },
  { id: "thigh", label: "Thigh" },
  { id: "buttock", label: "Buttock" },
] as const;

export function PeripheralVascularHpi({ b }: { b: HpiBindings }) {
  const { v, arr, setField, toggleArray } = b;
  const clearPv = () => {
    setField("pvSite", []);
    setField("pvDistanceMeters", "");
    setField("pvReliefRest", "");
    setField("pvProgression", "");
  };
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Wind className="h-5 w-5 text-indigo-600" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Peripheral vascular symptoms</h3>
      </div>
      <div className="space-y-4">
        <YesNoToggle
          label="Intermittent claudication"
          name="pv-claud"
          value={String(v("pvClaudication"))}
          onChange={(val) => {
            setField("pvClaudication", val);
            if (val !== "yes") clearPv();
          }}
        />
        {v("pvClaudication") === "yes" ? (
          <div className="space-y-4 rounded-lg border border-indigo-200/60 bg-white/80 p-4">
            <ChipMultiField label="Site" field="pvSite" options={PV_SITES} selectedIds={arr("pvSite")} onToggle={toggleArray} tone="violet" />
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#374151]">Distance to onset (meters)</Label>
              <Input
                placeholder="e.g. 100"
                value={String(v("pvDistanceMeters"))}
                onChange={(e) => setField("pvDistanceMeters", e.target.value)}
                className="h-10 max-w-xs bg-white"
              />
            </div>
            <YesNoToggle label="Relief with rest" name="pv-rest" value={String(v("pvReliefRest"))} onChange={(val) => setField("pvReliefRest", val)} />
            <SegmentedField
              label="Progression"
              value={String(v("pvProgression"))}
              onChange={(val) => setField("pvProgression", val)}
              options={[
                { value: "stable", label: "Stable" },
                { value: "worsening", label: "Worsening" },
              ]}
              accent="blue"
            />
          </div>
        ) : null}
        <YesNoToggle label="Rest pain" name="pv-restpain" value={String(v("pvRestPain"))} onChange={(val) => setField("pvRestPain", val)} />
        <YesNoToggle label="Non-healing ulcers" name="pv-ulcer" value={String(v("pvUlcers"))} onChange={(val) => setField("pvUlcers", val)} />
        <YesNoToggle label="Cold extremities" name="pv-cold" value={String(v("pvColdExtremities"))} onChange={(val) => setField("pvColdExtremities", val)} />
      </div>
    </div>
  );
}

export function HepaticCongestionHpi({ b }: { b: HpiBindings }) {
  const { v, setField } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <HeartPulse className="h-5 w-5 text-lime-800" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Hepatic / abdominal congestion</h3>
      </div>
      <div className="space-y-3">
        <YesNoToggle label="Abdominal distension" name="hep-dist" value={String(v("hepaticDistension"))} onChange={(val) => setField("hepaticDistension", val)} />
        <YesNoToggle label="Epigastric pain or heaviness" name="hep-epi" value={String(v("hepaticEpigastric"))} onChange={(val) => setField("hepaticEpigastric", val)} />
        <YesNoToggle label="Nausea" name="hep-nausea" value={String(v("hepaticNausea"))} onChange={(val) => setField("hepaticNausea", val)} />
        <YesNoToggle label="Reduced appetite" name="hep-app" value={String(v("hepaticAppetite"))} onChange={(val) => setField("hepaticAppetite", val)} />
      </div>
    </div>
  );
}

export function JaundiceHpi({ b }: { b: HpiBindings }) {
  const { v, setField } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Sun className="h-5 w-5 text-yellow-600" aria-hidden />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Jaundice</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#374151]">Onset</Label>
          <Input type="date" value={String(v("jaundiceOnsetDate"))} onChange={(e) => setField("jaundiceOnsetDate", e.target.value)} className="h-10 max-w-xs bg-white" />
        </div>
        <SegmentedField
          label="Course"
          value={String(v("jaundiceCourse"))}
          onChange={(val) => setField("jaundiceCourse", val)}
          options={[
            { value: "improving", label: "Improving" },
            { value: "stable", label: "Stable" },
            { value: "worsening", label: "Worsening" },
          ]}
          accent="amber"
        />
        <YesNoToggle label="Dark urine" name="jau-urine" value={String(v("jaundiceDarkUrine"))} onChange={(val) => setField("jaundiceDarkUrine", val)} />
        <YesNoToggle label="Pale stools" name="jau-stool" value={String(v("jaundicePaleStools"))} onChange={(val) => setField("jaundicePaleStools", val)} />
        <YesNoToggle label="Pruritus" name="jau-prur" value={String(v("jaundicePruritus"))} onChange={(val) => setField("jaundicePruritus", val)} />
      </div>
    </div>
  );
}

const CYAN_TYPE = [
  { id: "central", label: "Central (lips/tongue)" },
  { id: "peripheral", label: "Peripheral (fingers/toes)" },
] as const;

export function CyanosisHpi({ b }: { b: HpiBindings }) {
  const { v, arr, setField, toggleArray } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Skull className="h-5 w-5 text-sky-800" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Cyanosis</h3>
      </div>
      <div className="space-y-4">
        <ChipMultiField label="Type" field="cyanosisType" options={CYAN_TYPE} selectedIds={arr("cyanosisType")} onToggle={toggleArray} tone="blue" />
        <SegmentedField
          label="Timing"
          value={String(v("cyanosisTiming"))}
          onChange={(val) => setField("cyanosisTiming", val)}
          options={[
            { value: "rest", label: "At rest" },
            { value: "exertion", label: "On exertion" },
            { value: "both", label: "Both" },
          ]}
          accent="blue"
        />
        <SegmentedField
          label="Onset"
          value={String(v("cyanosisOnset"))}
          onChange={(val) => setField("cyanosisOnset", val)}
          options={[
            { value: "childhood", label: "Since childhood" },
            { value: "recent", label: "Recent onset" },
          ]}
          accent="blue"
        />
      </div>
    </div>
  );
}

export function EmbolizationHpi({ b }: { b: HpiBindings }) {
  const { v, setField } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-red-800" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Systemic embolization symptoms</h3>
      </div>
      <div className="space-y-3">
        <YesNoToggle label="Sudden limb pain or coldness" name="emb-limb" value={String(v("embLimbPain"))} onChange={(val) => setField("embLimbPain", val)} />
        <YesNoToggle label="Acute visual loss" name="emb-eye" value={String(v("embVisualLoss"))} onChange={(val) => setField("embVisualLoss", val)} />
        <YesNoToggle label="Flank pain" name="emb-flank" value={String(v("embFlankPain"))} onChange={(val) => setField("embFlankPain", val)} />
        <YesNoToggle label="Abdominal pain (mesenteric ischemia)" name="emb-abd" value={String(v("embAbdominalPain"))} onChange={(val) => setField("embAbdominalPain", val)} />
        <YesNoToggle label="TIA" name="emb-tia" value={String(v("embTIA"))} onChange={(val) => setField("embTIA", val)} />
        <YesNoToggle label="Stroke symptoms" name="emb-stroke" value={String(v("embStroke"))} onChange={(val) => setField("embStroke", val)} />
      </div>
    </div>
  );
}

export function NeurologicalHpi({ b }: { b: HpiBindings }) {
  const { v, setField } = b;
  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E6E0]/60 bg-[#F9F8F5]/50 p-5">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-purple-700" />
        <h3 className="text-sm font-bold tracking-tight text-[#1A5345]">Neurological symptoms</h3>
      </div>
      <div className="space-y-3">
        <YesNoToggle label="Dizziness" name="neuro-diz" value={String(v("neuroDizziness"))} onChange={(val) => setField("neuroDizziness", val)} />
        <YesNoToggle label="Syncope / presyncope" name="neuro-sync" value={String(v("neuroSyncope"))} onChange={(val) => setField("neuroSyncope", val)} />
        <YesNoToggle label="Focal weakness" name="neuro-weak" value={String(v("neuroWeakness"))} onChange={(val) => setField("neuroWeakness", val)} />
        <YesNoToggle label="Speech difficulty" name="neuro-speech" value={String(v("neuroSpeech"))} onChange={(val) => setField("neuroSpeech", val)} />
        <YesNoToggle label="Visual disturbance" name="neuro-vis" value={String(v("neuroVisual"))} onChange={(val) => setField("neuroVisual", val)} />
        <YesNoToggle label="Confusion" name="neuro-conf" value={String(v("neuroConfusion"))} onChange={(val) => setField("neuroConfusion", val)} />
      </div>
    </div>
  );
}
