import { tool } from 'langchain';
import { z } from 'zod';

import type { DoctorToolsService } from './doctor-tools.service';

const patientIdSchema = z.object({
  patientIdentifier: z
    .string()
    .describe(
      'Patient number (e.g. P-001), UUID, or full name — must be in your accessible panel.',
    ),
});

export function buildDoctorLangChainTools(
  toolsService: DoctorToolsService,
  doctorId: string,
) {
  const listPatients = tool(
    async () => {
      return toolsService.listPatients(doctorId);
    },
    {
      name: 'list_patients',
      description:
        'List all patients accessible to this doctor — names, patient numbers, age/gender, risk level. Call this first when you need to find a patient or summarise the panel.',
      schema: z.object({}),
    },
  );

  const getPatientOverview = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientOverview(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_overview',
      description:
        'Full profile, medical history, allergies, family history, and active medications for a specific patient.',
      schema: patientIdSchema,
    },
  );

  const getPatientConsultations = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientConsultations(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_consultations',
      description:
        'Last 6 completed consultations for a patient — visit type, chief complaint, HPI, diagnoses, prescriptions, plan, follow-up instructions.',
      schema: patientIdSchema,
    },
  );

  const getPatientMedications = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientMedications(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_medications',
      description:
        'Full medication list for a patient — active and discontinued, with dose, compliance, adherence %, side effects, prescribing doctor.',
      schema: patientIdSchema,
    },
  );

  const getPatientVitals = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientVitals(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_vitals',
      description:
        'Last 10 vital readings for a patient — BP, HR, SpO2, weight, temperature, blood glucose (home and clinic sources).',
      schema: patientIdSchema,
    },
  );

  const getPatientLabResults = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientLabResults(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_lab_results',
      description:
        'Latest lab results for a patient — deduped by test name, abnormal values flagged separately.',
      schema: patientIdSchema,
    },
  );

  const getPatientClinicalNotes = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientClinicalNotes(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_clinical_notes',
      description:
        'Clinical and AI-generated notes for a patient — full text of all notes ordered by date.',
      schema: patientIdSchema,
    },
  );

  const getPatientProcedures = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientProcedures(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_procedures',
      description:
        'Procedure orders for a patient — name, department, status (pending/in-progress/completed), priority, scheduled date, risk score.',
      schema: patientIdSchema,
    },
  );

  const getPatientAiAnalyses = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientAiAnalyses(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_ai_analyses',
      description:
        'AI analysis results for a patient — Echocardiogram AI report, ECG AI findings, Chest X-ray risk + findings, Cine-MRI diagnosis class + cardiac function (EF, EDV, ESV).',
      schema: patientIdSchema,
    },
  );

  const getPatientDiagnoses = tool(
    async ({ patientIdentifier }) => {
      return toolsService.getPatientDiagnoses(doctorId, patientIdentifier);
    },
    {
      name: 'get_patient_diagnoses',
      description:
        'All diagnoses for a patient — ICD codes, type (primary/secondary/differential), severity, status (active/chronic/resolved), NYHA class if applicable.',
      schema: patientIdSchema,
    },
  );

  const searchPatients = tool(
    async ({ criteria }) => {
      return toolsService.searchPatients(doctorId, criteria);
    },
    {
      name: 'search_patients',
      description:
        'Search your accessible patients by a specific criterion. Examples: "procedures tomorrow", "procedures today", "pending procedures", "high risk", "abnormal labs", "follow-up needed". Returns matching patients with relevant context. Use this when the doctor asks about a group of patients matching a condition rather than a specific named patient.',
      schema: z.object({
        criteria: z.string().describe(
          'Natural language search criterion — e.g. "procedures tomorrow", "high risk patients", "abnormal labs", "needs follow-up"',
        ),
      }),
    },
  );

  return [
    listPatients,
    getPatientOverview,
    getPatientConsultations,
    getPatientMedications,
    getPatientVitals,
    getPatientLabResults,
    getPatientClinicalNotes,
    getPatientProcedures,
    getPatientAiAnalyses,
    getPatientDiagnoses,
    searchPatients,
  ];
}
