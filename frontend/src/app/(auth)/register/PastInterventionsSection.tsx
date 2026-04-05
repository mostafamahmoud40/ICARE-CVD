"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type {
  PastInterventionDetails,
  PastInterventionProcedureKey,
  PastInterventionsDetailsState,
  PastInterventionsState,
} from "./register.types";

function NativeSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className ?? "",
      ].join(" ")}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

const MONTH_OPTIONS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

const YEAR_START = 1950;
const YEAR_END = 2026;

function buildYearOptions() {
  const years: Array<{ value: string; label: string }> = [];
  for (let y = YEAR_END; y >= YEAR_START; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

const YEAR_OPTIONS = buildYearOptions();

function MonthYearField({
  label,
  value,
  onChange,
  optional,
  idPrefix,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  optional?: boolean;
  idPrefix: string;
}) {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  const year = match?.[1] ?? "";
  const month = match?.[2] ?? "";

  const commit = (nextYear: string, nextMonth: string) => {
    if (nextYear && nextMonth) {
      onChange(`${nextYear}-${nextMonth}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#1A1A2E]">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        <NativeSelect
          id={`${idPrefix}-month`}
          value={month}
          onChange={(m) => commit(year, m)}
          placeholder="Month"
          options={[...MONTH_OPTIONS]}
        />
        <NativeSelect
          id={`${idPrefix}-year`}
          value={year}
          onChange={(y) => commit(y, month)}
          placeholder="Year"
          options={YEAR_OPTIONS}
        />
      </div>
    </div>
  );
}

function getDetailFor<K extends PastInterventionProcedureKey>(
  details: PastInterventionsDetailsState,
  key: K
): PastInterventionDetails[K] {
  return (details[key] ?? defaultDetailsFor(key)) as PastInterventionDetails[K];
}

function putProcedureDetail<K extends PastInterventionProcedureKey>(
  details: PastInterventionsDetailsState,
  key: K,
  value: PastInterventionDetails[K]
) {
  details[key] = value;
}

function defaultDetailsFor<K extends PastInterventionProcedureKey>(id: K): PastInterventionDetails[K] {
  switch (id) {
    case "catheterization":
      return { dateMy: "", result: "" } as PastInterventionDetails[K];
    case "pci":
      return { dateMy: "", vessel: "" } as PastInterventionDetails[K];
    case "cabg":
      return { dateMy: "", grafts: "" } as PastInterventionDetails[K];
    case "valve":
      return { dateMy: "", valve: "", procedureType: "", notes: "" } as PastInterventionDetails[K];
    case "pacemaker":
      return {
        dateImplantedMy: "",
        deviceType: "",
        stillActive: "",
        lastCheckMy: "",
      } as PastInterventionDetails[K];
    case "ablation":
      return { dateMy: "", arrhythmiaType: "" } as PastInterventionDetails[K];
    case "transplant":
      return { dateMy: "", center: "" } as PastInterventionDetails[K];
    default: {
      const _x: never = id;
      return _x;
    }
  }
}

function normalizeState(raw: unknown): PastInterventionsState {
  if (!raw || typeof raw !== "object") {
    return { selected: [], details: {} };
  }
  const o = raw as Partial<PastInterventionsState>;
  const selected = Array.isArray(o.selected) ? o.selected : [];
  const details = o.details && typeof o.details === "object" ? o.details : {};
  return { selected, details: { ...details } };
}

const PROCEDURE_ROWS: Array<{ id: PastInterventionProcedureKey; label: string }> = [
  { id: "catheterization", label: "Heart catheterization (angiogram)" },
  { id: "pci", label: "Stent / angioplasty (PCI)" },
  { id: "cabg", label: "Bypass surgery (CABG)" },
  { id: "valve", label: "Valve surgery / replacement" },
  { id: "pacemaker", label: "Pacemaker / ICD device" },
  { id: "ablation", label: "Ablation for arrhythmia" },
  { id: "transplant", label: "Heart transplant" },
];

type PastInterventionsSectionProps = {
  value: unknown;
  onChange: (next: PastInterventionsState) => void;
};

export function PastInterventionsSection({ value, onChange }: PastInterventionsSectionProps) {
  const state = normalizeState(value);

  const setState = (next: PastInterventionsState) => {
    onChange(next);
  };

  const toggle = (id: PastInterventionProcedureKey | "none", checked: boolean) => {
    if (!checked) {
      if (id === "none") {
        setState({ ...state, selected: state.selected.filter((x) => x !== "none") });
        return;
      }
      const nextDetails = { ...state.details };
      delete nextDetails[id];
      setState({
        selected: state.selected.filter((x) => x !== id),
        details: nextDetails,
      });
      return;
    }

    if (id === "none") {
      setState({ selected: ["none"], details: {} });
      return;
    }

    const withoutNone = state.selected.filter((x) => x !== "none");
    if (withoutNone.includes(id)) return;

    const nextDetails: PastInterventionsDetailsState = { ...state.details };
    if (!nextDetails[id]) {
      putProcedureDetail(nextDetails, id, defaultDetailsFor(id));
    }

    setState({
      selected: [...withoutNone, id],
      details: nextDetails,
    });
  };

  const patchDetail = <K extends PastInterventionProcedureKey>(
    key: K,
    patch: Partial<PastInterventionDetails[K]>
  ) => {
    const base = getDetailFor(state.details, key);
    const nextDetail = { ...base, ...patch } as PastInterventionDetails[K];
    setState({
      ...state,
      details: {
        ...state.details,
        [key]: nextDetail,
      },
    });
  };

  const isSelected = (id: PastInterventionProcedureKey | "none") => state.selected.includes(id);

  return (
    <div className="space-y-2">
        {PROCEDURE_ROWS.map((row) => {
          const checked = isSelected(row.id);

          return (
            <div
              key={row.id}
              className="overflow-hidden rounded-lg border border-input bg-card text-card-foreground shadow-sm"
            >
              <div className="flex items-start gap-3 p-3">
                <Checkbox
                  id={`pi-${row.id}`}
                  checked={checked}
                  onCheckedChange={(v) => toggle(row.id, v === true)}
                  className="mt-0.5"
                  aria-labelledby={`pi-label-${row.id}`}
                />
                <label htmlFor={`pi-${row.id}`} id={`pi-label-${row.id}`} className="flex-1 cursor-pointer text-sm font-medium text-[#1A1A2E]">
                  {row.label}
                </label>
              </div>

              {checked ? (
                <div className="space-y-3 border-t bg-muted/20 px-3 pb-4 pt-3">
                  {row.id === "catheterization" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MonthYearField
                        idPrefix={`pi-cath-${row.id}`}
                        label="Date"
                        value={getDetailFor(state.details, "catheterization").dateMy}
                        onChange={(next) => patchDetail("catheterization", { dateMy: next })}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Result</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "catheterization").result}
                          onChange={(next) => patchDetail("catheterization", { result: next })}
                          placeholder="Select result"
                          options={[
                            { value: "normal", label: "Normal" },
                            { value: "stenosis", label: "Stenosis found" },
                            { value: "occlusion", label: "Total occlusion" },
                            { value: "other", label: "Other" },
                          ]}
                        />
                      </div>
                    </div>
                  ) : null}

                  {row.id === "pci" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MonthYearField
                        idPrefix="pi-pci"
                        label="Date"
                        value={getDetailFor(state.details, "pci").dateMy}
                        onChange={(next) => patchDetail("pci", { dateMy: next })}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Vessel</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "pci").vessel}
                          onChange={(next) => patchDetail("pci", { vessel: next })}
                          placeholder="Select vessel"
                          options={[
                            { value: "lad", label: "LAD" },
                            { value: "rca", label: "RCA" },
                            { value: "lcx", label: "LCX" },
                            { value: "lm", label: "LM" },
                            { value: "multiple", label: "Multiple" },
                            { value: "unknown", label: "Unknown" },
                          ]}
                        />
                      </div>
                    </div>
                  ) : null}

                  {row.id === "cabg" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MonthYearField
                        idPrefix="pi-cabg"
                        label="Date"
                        value={getDetailFor(state.details, "cabg").dateMy}
                        onChange={(next) => patchDetail("cabg", { dateMy: next })}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Number of grafts</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "cabg").grafts}
                          onChange={(next) => patchDetail("cabg", { grafts: next })}
                          placeholder="Select graft count"
                          options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                            { value: "4plus", label: "4+" },
                            { value: "unknown", label: "Unknown" },
                          ]}
                        />
                      </div>
                    </div>
                  ) : null}

                  {row.id === "valve" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MonthYearField
                        idPrefix="pi-valve"
                        label="Date"
                        value={getDetailFor(state.details, "valve").dateMy}
                        onChange={(next) => patchDetail("valve", { dateMy: next })}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Valve</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "valve").valve}
                          onChange={(next) => patchDetail("valve", { valve: next })}
                          placeholder="Select valve"
                          options={[
                            { value: "mitral", label: "Mitral" },
                            { value: "aortic", label: "Aortic" },
                            { value: "tricuspid", label: "Tricuspid" },
                            { value: "pulmonary", label: "Pulmonary" },
                            { value: "multiple", label: "Multiple" },
                          ]}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Type</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "valve").procedureType}
                          onChange={(next) => patchDetail("valve", { procedureType: next })}
                          placeholder="Select type"
                          options={[
                            { value: "repair", label: "Repair" },
                            { value: "replacement_mechanical", label: "Replacement — mechanical" },
                            { value: "replacement_biological", label: "Replacement — biological" },
                          ]}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-sm font-medium text-[#1A1A2E]">
                          Notes <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                          value={getDetailFor(state.details, "valve").notes}
                          onChange={(e) => patchDetail("valve", { notes: e.target.value })}
                          placeholder="Additional notes"
                          className="min-h-[72px] resize-y"
                        />
                      </div>
                    </div>
                  ) : null}

                  {row.id === "pacemaker" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MonthYearField
                        idPrefix="pi-pm-impl"
                        label="Date implanted"
                        value={getDetailFor(state.details, "pacemaker").dateImplantedMy}
                        onChange={(next) => patchDetail("pacemaker", { dateImplantedMy: next })}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Device type</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "pacemaker").deviceType}
                          onChange={(next) => patchDetail("pacemaker", { deviceType: next })}
                          placeholder="Select device type"
                          options={[
                            { value: "pacemaker", label: "Pacemaker" },
                            { value: "icd", label: "ICD" },
                            { value: "crt_p", label: "CRT-P" },
                            { value: "crt_d", label: "CRT-D" },
                            { value: "unknown", label: "Unknown" },
                          ]}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Still active?</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "pacemaker").stillActive}
                          onChange={(next) => patchDetail("pacemaker", { stillActive: next })}
                          placeholder="Select"
                          options={[
                            { value: "yes", label: "Yes" },
                            { value: "no_removed", label: "No — removed" },
                            { value: "unknown", label: "Unknown" },
                          ]}
                        />
                      </div>
                      <MonthYearField
                        idPrefix="pi-pm-last"
                        label="Last check"
                        value={getDetailFor(state.details, "pacemaker").lastCheckMy}
                        onChange={(next) => patchDetail("pacemaker", { lastCheckMy: next })}
                      />
                    </div>
                  ) : null}

                  {row.id === "ablation" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MonthYearField
                        idPrefix="pi-abl"
                        label="Date"
                        value={getDetailFor(state.details, "ablation").dateMy}
                        onChange={(next) => patchDetail("ablation", { dateMy: next })}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">Arrhythmia type</Label>
                        <NativeSelect
                          value={getDetailFor(state.details, "ablation").arrhythmiaType}
                          onChange={(next) => patchDetail("ablation", { arrhythmiaType: next })}
                          placeholder="Select type"
                          options={[
                            { value: "af", label: "Atrial fibrillation (AF)" },
                            { value: "flutter", label: "Atrial flutter" },
                            { value: "svt", label: "SVT" },
                            { value: "vt", label: "VT" },
                            { value: "wpw", label: "WPW" },
                            { value: "other", label: "Other" },
                          ]}
                        />
                      </div>
                    </div>
                  ) : null}

                  {row.id === "transplant" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <MonthYearField
                        idPrefix="pi-tx"
                        label="Date"
                        value={getDetailFor(state.details, "transplant").dateMy}
                        onChange={(next) => patchDetail("transplant", { dateMy: next })}
                      />
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium text-[#1A1A2E]">
                          Center / hospital{" "}
                          <span className="font-normal text-muted-foreground">(optional)</span>
                        </Label>
                        <Input
                          type="text"
                          value={getDetailFor(state.details, "transplant").center}
                          onChange={(e) => patchDetail("transplant", { center: e.target.value })}
                          className="h-10"
                          placeholder="Name of center"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        <div className="overflow-hidden rounded-lg border border-input bg-card text-card-foreground shadow-sm">
          <div className="flex items-start gap-3 p-3">
            <Checkbox
              id="pi-none"
              checked={isSelected("none")}
              onCheckedChange={(v) => toggle("none", v === true)}
              className="mt-0.5"
              aria-labelledby="pi-label-none"
            />
            <label htmlFor="pi-none" id="pi-label-none" className="flex-1 cursor-pointer text-sm font-medium text-[#1A1A2E]">
              None of the above
            </label>
          </div>
        </div>
    </div>
  );
}
