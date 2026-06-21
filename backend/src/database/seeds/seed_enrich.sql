-- =============================================================
-- ICARE-CVD  —  Enrichment Seed
-- Fills: consultation clinical text, care goals,
--        past appointments, vital-consultation links,
--        dose logs (realistic compliance per patient)
-- =============================================================

DO $$
DECLARE
  doc UUID := 'f29232bf-77d3-44b8-a86e-5b5486c16a69';

  -- patient UUIDs
  p3  UUID := 'a75baad1-6b1f-4219-a1b8-6330342c5ae6';
  p4  UUID := '633b5ebe-d972-42d1-97ec-f4c9ab56c1ec';
  p5  UUID := 'ab15dbbd-9a02-4441-905e-e6e0839f711d';
  p6  UUID := '7b7bf625-d80a-4b4d-8672-5573376b4696';
  p7  UUID := '0a67efb9-8bff-47e3-8ed7-d35e5eab957e';
  p8  UUID := 'd9d75a60-bbf8-4294-993c-f72076b2eb56';
  p9  UUID := '02ad9aab-bb46-4a87-a929-398bc95d9c0d';
  p10 UUID := 'c63e474a-4b5c-408c-8cf1-29daedeaba2d';

  -- user IDs (integer)
  u3  INTEGER := 87;  u4  INTEGER := 88;
  u5  INTEGER := 89;  u6  INTEGER := 90;
  u7  INTEGER := 91;  u8  INTEGER := 92;
  u9  INTEGER := 93;  u10 INTEGER := 94;

  -- consultation IDs
  c3a UUID := '0b30523d-6d80-4a15-8ef2-086eef97c784'; -- P-003 new
  c3b UUID := '0580da07-a0e2-44fa-89a0-cd81b55b87d3'; -- P-003 fu1
  c3c UUID := '49dd3191-ce62-4e2e-bfce-6e915cba68bd'; -- P-003 fu2
  c3d UUID := 'a619a32f-1949-4c9a-b5be-5aef6dbd3290'; -- P-003 fu3
  c4a UUID := '11b0149e-ed19-48be-adbe-7a3b9f73458d'; -- P-004 new
  c4b UUID := '8e1f71d4-752d-457f-b5b0-b424594818d5'; -- P-004 fu1
  c4c UUID := '5840789b-e000-4dc6-89ba-00f4a460b065'; -- P-004 fu2
  c5a UUID := 'dc63557f-74ef-4c15-a2ff-3542bb181972'; -- P-005 new
  c5b UUID := '7e12d91f-caf8-4798-9007-69aa28f9a2d0'; -- P-005 fu1
  c6a UUID := '2b1b8660-977c-4cd1-accb-3d656b774178'; -- P-006 post-proc
  c6b UUID := '4f5d359e-597a-40a3-b149-af3f9218c020'; -- P-006 fu1
  c6c UUID := '8a3fce93-9649-4903-86fd-21b206706d77'; -- P-006 fu2
  c6d UUID := 'd7352bd0-1b49-4951-afcc-09fed91e3b9b'; -- P-006 fu3
  c7a UUID := 'c4cd096d-2af7-4f31-ac52-2b1ecc2388bc'; -- P-007 new
  c7b UUID := 'a7a8a63a-f3e5-4664-b97f-4f7d25ad09e7'; -- P-007 fu1
  c8a UUID := 'ae2a7362-61c5-46ca-8a6b-bd12cb86c282'; -- P-008 new
  c8b UUID := 'dccb2ff6-1955-4b04-80e0-23189a126550'; -- P-008 fu1
  c9a UUID := 'e7fce5f8-e109-413d-a783-b3df48a3dde4'; -- P-009 urgent
  c9b UUID := '82fd5533-f321-4864-a4ff-f501b912eb69'; -- P-009 fu1
  c10a UUID := 'b993d5ba-891f-4db7-a45e-1f01c17cdd3c'; -- P-010 new

  -- medication IDs
  m3_amlo  UUID := 'a205830a-e28e-4aaa-b9a7-193288212d5c';
  m3_ator  UUID := 'fe4e85c1-6fdf-475e-bca4-8828decfcbf6';
  m3_biso  UUID := '96c24c70-83f3-4798-91d6-5b17b69fe411';
  m3_asp   UUID := 'c8eee9a8-46d6-479c-882f-51bbdb475c4e';
  m4_lisi  UUID := 'fd46988b-fbd4-4854-9bd6-dcea26585df7';
  m4_metf  UUID := 'e9ed7c85-de83-4ccc-8c9f-3a7e548c43d1';
  m4_carv  UUID := 'a241634b-3a07-40dd-8f1a-994ec0c2bae4';
  m4_furo  UUID := '9643afba-7b06-4a39-83e5-dd9075fbdcaf';
  m5_amlo  UUID := '910f49e0-0fd7-4651-bcf5-fdaa57b56279';
  m5_biso  UUID := '3d6b64c9-ba00-4881-b2fb-b0cbd9ad1f29';
  m5_riva  UUID := '4b5daa53-42c0-43f5-8cd1-0967f30df067';
  m6_ator  UUID := '4ce2b62a-3947-4bdc-9f6c-d1e875288bf9';
  m6_rami  UUID := 'e792d75f-e7e5-4a22-b2f7-199ee68f224d';
  m6_carv  UUID := '031fa754-3e2a-4736-8b07-36ad8d3efbca';
  m6_asp   UUID := 'db3a5865-9ee3-4524-a0c1-6833c49f0e18';
  m7_amlo  UUID := 'f91c47e8-e3a3-4c9b-95fe-abd838e9dec1';
  m7_ator  UUID := 'ceaa61ad-1fea-4374-967d-35a1219d7b3f';
  m8_vals  UUID := '65453e22-9d92-4d27-88f6-29c724cd3e03';
  m8_nebi  UUID := '87e30948-ac7a-406f-869f-a9f0f1ae3822';
  m9_metf  UUID := '65f56268-d873-41c1-9176-d942a568a33a';
  m10_biso UUID := 'b7c4cdeb-2578-44ed-969d-eb4fc4525a36';

  v_day DATE;
  v_skip BOOLEAN;
  v_med UUID;
  i INTEGER;

BEGIN

/* ================================================================
   PART 1 – UPDATE CONSULTATIONS WITH FULL CLINICAL DATA
   ================================================================ */

-- P-003 Visit 1: New patient, CAD + HTN
UPDATE consultation SET
  history_of_present_illness = 'Mr. Khaled Hassan, 61-year-old male engineer, presents with a 2-month history of exertional chest tightness described as pressure-like, CCS Class II, occurring on moderate effort such as climbing two flights of stairs. Associated mild dyspnea. Symptoms resolve within 5 minutes of rest. Denies rest pain or radiation to jaw/arm. No prior cardiac evaluation. Background: hypertension diagnosed 2019, on Amlodipine but BP not at goal. Former smoker (10 pack-years). Family history: father died of MI at 58.',
  physical_exam = 'BP 168/104 mmHg (right arm). HR 82 bpm, regular. RR 16. SpO2 96%. Weight 92 kg. BMI 30.1. General: alert, comfortable at rest. CVS: normal S1/S2, no murmurs. Resp: clear bilaterally. Abdomen: soft, no organomegaly. Peripheral pulses present and equal. No ankle oedema. Fundoscopy: Grade II hypertensive retinopathy.',
  plan = 'ETT ordered – positive at 75W moderate effort (4 MET). Coronary CTA subsequently confirmed 50% LAD stenosis. Diagnosis: Stable Angina, Hypertension Grade II. Initiated: Bisoprolol 5 mg OD, Aspirin 75 mg OD. Existing Amlodipine continued 10 mg. Atorvastatin 40 mg ON added. Lipid panel + RFT + fasting glucose ordered. Follow-up in 8 weeks.',
  follow_up_timeframe = '8 weeks',
  follow_up_instructions = 'Repeat BP check and angina frequency diary review. Bring lipid panel results. Consider dose titration.',
  home_monitoring = '["Monitor BP twice daily at the same time each day – record in diary", "Note frequency, duration and severity of chest pain episodes", "Seek emergency care if chest pain persists > 15 minutes or occurs at rest"]',
  patient_diagnosis_summary = 'You have two conditions being managed: (1) Angina – a type of chest tightness that happens when your heart muscle is not getting enough blood during effort. It is not a heart attack but a warning sign. (2) High blood pressure (Hypertension Grade 2) – your blood pressure is higher than it should be, which puts strain on your heart and arteries.',
  patient_lifestyle_advice = 'Reduce salt intake to < 5 g/day. Follow a Mediterranean-style diet (vegetables, fish, olive oil). Aim for 30 minutes of moderate walking on flat ground daily – stop if chest tightness starts. Quit smoking completely. Avoid heavy lifting. Maintain healthy weight.',
  patient_danger_signs = 'Go to the emergency department immediately if: chest pain occurs at rest or lasts more than 15 minutes, chest pain spreads to your jaw or left arm, you feel suddenly dizzy or faint, you have severe shortness of breath at rest.'
WHERE id = c3a;

-- P-003 Visit 2: Follow-up
UPDATE consultation SET
  history_of_present_illness = 'Patient returns 8 weeks post-initiation of Bisoprolol and Aspirin. Reports angina episodes now 2-3×/week on exertion. BP diary shows readings 158-168/98-104. No side effects from new medications. Compliant with medications.',
  physical_exam = 'BP 162/100 mmHg. HR 80 bpm. No ankle oedema. Normal cardiovascular exam.',
  plan = 'BP still above target. Angina frequency improved but not at goal. Continue current regimen. Reinforce salt restriction. Repeat lipid panel at next visit. Follow-up in 12 weeks.',
  follow_up_timeframe = '12 weeks',
  follow_up_instructions = 'Bring lipid panel results. BP diary essential. Consider dose increase if BP remains > 155/95.',
  home_monitoring = '["Continue BP diary twice daily", "Keep angina frequency diary", "Weigh yourself weekly"]',
  patient_diagnosis_summary = 'Your heart condition and blood pressure are being treated. The medicines are starting to work – your angina is slightly better. We will keep adjusting until both are fully controlled.',
  patient_lifestyle_advice = 'Continue reducing salt. Start walking 20-30 min daily on flat ground at a comfortable pace – stop if chest tightness appears. Avoid large meals and hot environments.',
  patient_danger_signs = 'Emergency department if: chest pain at rest, pain > 15 min, sudden severe breathlessness.'
WHERE id = c3b;

-- P-003 Visit 3: Lipid panel review
UPDATE consultation SET
  history_of_present_illness = 'Lipid panel results reviewed. LDL 4.1 mmol/L (above target < 2.6 for angina patient). Total cholesterol 6.2. Patient reports angina now 1×/week. BP diary: 155-162/94-100. Compliant with all medications. No statin side effects.',
  physical_exam = 'BP 158/98 mmHg. HR 78. Weight 91.5 kg (down 0.5 kg). No musculoskeletal complaints.',
  plan = 'LDL significantly above target. Atorvastatin increased to 40 mg (already on 40 mg – will reassess in 3 months). Dietary counselling given – refer to dietitian. Repeat fasting lipid panel in 3 months. Goal LDL < 2.6 mmol/L. BP: add HCTZ 12.5 mg if not at target by next visit.',
  follow_up_timeframe = '12 weeks',
  follow_up_instructions = 'Repeat lipid panel and RFT. Review BP diary. Dietary changes assessment.',
  home_monitoring = '["Continue BP diary", "Keep food diary for dietitian assessment", "Take Atorvastatin at bedtime without exception"]',
  patient_diagnosis_summary = 'Your blood cholesterol is too high – this feeds the fatty deposits blocking your heart arteries. We have maximised your cholesterol tablet dose and need you to eat less fatty foods.',
  patient_lifestyle_advice = 'Eliminate processed foods, fried foods and full-fat dairy. Replace with grilled fish (especially oily fish 2×/week), plenty of vegetables, oats, and nuts. No added salt.',
  patient_danger_signs = 'If you develop muscle pain or weakness (could be statin side effect), contact us. Emergency if chest pain at rest or > 15 minutes.'
WHERE id = c3c;

-- P-003 Visit 4: Quarterly review
UPDATE consultation SET
  history_of_present_illness = 'Quarterly review. Patient reports excellent improvement – angina now only 1×/month on very vigorous effort. BP diary shows consistent readings 148-156/90-96. Compliant with all medications. LDL reduced to 3.2 mmol/L (improved but still above target). No side effects.',
  physical_exam = 'BP 152/94 mmHg. HR 76. Weight 90 kg (2 kg loss). Cardiovascular exam unchanged.',
  plan = 'Good overall response. Angina well-controlled. Target LDL not yet reached – continue dietary efforts. Next visit in 3 months with fasting lipid panel.',
  follow_up_timeframe = '3 months',
  follow_up_instructions = 'Repeat lipid panel + fasting glucose. Annual ECG. Continue current medications.',
  home_monitoring = '["Continue BP diary twice daily", "Note any new symptoms"]',
  patient_diagnosis_summary = 'Great progress! Your angina is almost gone, blood pressure is coming down, and you have lost 2 kg. Keep up your diet and exercise.',
  patient_lifestyle_advice = 'Continue current diet and walking programme. Target 10,000 steps/day. Maintain weight loss.',
  patient_danger_signs = 'Emergency if chest pain at rest or lasting > 15 minutes, or any sudden breathlessness.'
WHERE id = c3d;

-- P-004 Visit 1: New HF diagnosis
UPDATE consultation SET
  history_of_present_illness = 'Mrs. Maha Ibrahim, 54-year-old teacher, presents with 3-month history of progressive exertional dyspnea, now occurring on climbing one flight of stairs (NYHA Class II). Associated mild ankle swelling in the evening. No orthopnoea. No PND. Background: T2DM (HbA1c 8.4% 6 months ago), Hypertension on Lisinopril. Non-smoker. Gaining weight gradually.',
  physical_exam = 'BP 148/92 mmHg. HR 76. RR 18. SpO2 95%. Weight 75 kg. JVP elevated at 4 cm. S3 gallop present. Bilateral basal fine crackles. Mild pitting ankle oedema bilateral. ECG: LVH pattern.',
  plan = 'Echo ordered: EF 38%, dilated LV, LV wall motion abnormality anterior segment. BNP 380 pg/mL. Diagnosis: HFrEF, NYHA Class II. Started Carvedilol 6.25 mg BD and Furosemide 40 mg OD. Metformin continued. Lisinopril continued. Daily weight monitoring instructed. Follow-up 6 weeks.',
  follow_up_timeframe = '6 weeks',
  follow_up_instructions = 'Bring daily weight chart. Repeat BNP. Assess diuretic response and oedema.',
  home_monitoring = '["Weigh yourself every morning before breakfast – record in diary", "If weight increases > 2 kg in 2 days, call us immediately", "Monitor ankles for swelling daily", "Measure urine output approximately daily"]',
  patient_diagnosis_summary = 'Your heart muscle is not pumping as strongly as it should be – this is called heart failure. It is causing your breathlessness and ankle swelling. This is treatable with medicines and lifestyle changes. We have started tablets to reduce fluid build-up and help your heart beat more efficiently.',
  patient_lifestyle_advice = 'Limit fluid to 1.5–2 litres per day. Reduce salt strictly to < 2 g/day. Avoid alcohol completely. Rest when breathless. Gentle walking as tolerated (5–10 minutes twice daily). Do not skip any medications.',
  patient_danger_signs = 'Go to emergency department if: sudden severe breathlessness, inability to lie flat, coughing up pink frothy sputum, sudden weight gain > 2 kg overnight, chest pain, or you feel faint.'
WHERE id = c4a;

-- P-004 Visit 2: Follow-up
UPDATE consultation SET
  history_of_present_illness = 'Mrs. Ibrahim returns 6 weeks post-HF diagnosis. Dyspnea slightly improved – can now climb stairs with less difficulty. Ankle oedema reduced. Weight diary shows 1.5 kg loss since starting Furosemide. Blood sugar readings home 8-11 mmol/L (still high). HbA1c 8.2% (recent).',
  physical_exam = 'BP 142/88. HR 74. No JVP elevation. Crackles resolved. Mild ankle oedema still present. Weight 73.5 kg.',
  plan = 'Good diuretic response. HF improving. HbA1c 8.2% – increase Metformin to 1000 mg BD (if renal function permits). RFT: Cr 1.2 mg/dL – acceptable. Carvedilol: plan uptitration to 12.5 mg BD if HR/BP tolerates at next visit.',
  follow_up_timeframe = '8 weeks',
  follow_up_instructions = 'Repeat HbA1c and RFT in 8 weeks. Continue daily weight. Uptitrate Carvedilol if HR > 70 and BP tolerates.',
  home_monitoring = '["Continue daily weight chart", "Check blood sugar twice daily (fasting and 2 hours after largest meal)", "Call if breathlessness worsens suddenly"]',
  patient_diagnosis_summary = 'Your heart is responding to treatment – the fluid in your lungs and ankles is reducing. Your diabetes is still a little too high and we have adjusted the dose of your diabetes tablet.',
  patient_lifestyle_advice = 'Continue strict salt restriction. Avoid sweet drinks and sweets. Walk 10-15 minutes daily on flat ground.',
  patient_danger_signs = 'Emergency if: sudden severe breathlessness, chest pain, or weight gain > 2 kg in 2 days.'
WHERE id = c4b;

-- P-004 Visit 3: Weight gain (possible fluid retention)
UPDATE consultation SET
  history_of_present_illness = 'Mrs. Ibrahim contacts clinic: weight gained 2 kg over 14 days. Mild increase in ankle swelling. No worsening breathlessness. Blood sugar control improving (HbA1c 7.8% at recent check). Currently on Furosemide 40 mg OD, Carvedilol 6.25 mg BD.',
  physical_exam = 'BP 138/86. HR 72. Bilateral mild ankle oedema. Weight 75 kg (back to baseline). Crackles absent.',
  plan = 'Fluid retention likely due to hot weather and increased dietary sodium. Furosemide temporarily increased to 80 mg OD for 5 days then return to 40 mg. Strict dietary sodium reinforcement. Uptitrate Carvedilol to 12.5 mg BD next visit. HbA1c 7.8% – still above target.',
  follow_up_timeframe = '10 weeks',
  follow_up_instructions = 'Return to Furosemide 40 mg after 5 days. Bring weight chart. Repeat BNP and RFT.',
  home_monitoring = '["Continue daily weight – if > 2 kg increase call us same day", "Return to Furosemide 40 mg after 5 days of 80 mg course", "Measure ankles morning and evening"]',
  patient_diagnosis_summary = 'Your heart failure led to some fluid accumulation again, likely related to salt in your food. We have temporarily increased your water tablet dose. You are doing well overall – blood sugar is improving.',
  patient_lifestyle_advice = 'Be very strict about salt – avoid processed food, pickles, tinned foods. Continue walking gently.',
  patient_danger_signs = 'Emergency if: sudden severe breathlessness, chest pain, weight up > 3 kg overnight.'
WHERE id = c4c;

-- P-005 Visit 1: AF new diagnosis
UPDATE consultation SET
  history_of_present_illness = 'Mr. Tarek Mansour, 46-year-old accountant, presents with 3-month history of recurrent palpitations described as irregular, fast heartbeat episodes lasting hours to days. Associated mild dyspnea during episodes. No syncope. Background: hypertension on Amlodipine 5 mg OD. Current smoker (10 pack-years). CHA₂DS₂-VASc score: 2 (HTN, male, age 48 at first event).',
  physical_exam = 'BP 148/96. HR 92 bpm (irregular). SpO2 98%. Weight 85 kg. 12-lead ECG: absent P-waves, irregularly irregular rhythm – AF confirmed. No signs of heart failure. Thyroid not enlarged.',
  plan = '24-hour Holter: AF in 68% of recording. TSH normal. Echo: mild LVH, EF 58%. Diagnosis: Persistent AF. CHA₂DS₂-VASc = 2 – anticoagulation indicated. Started Rivaroxaban 20 mg OD with evening meal. Rate control: Bisoprolol 5 mg OD. Smoking cessation counselled strongly.',
  follow_up_timeframe = '4 months',
  follow_up_instructions = 'Assess rate control (target resting HR 60-80). Check Rivaroxaban compliance. Repeat ECG.',
  home_monitoring = '["Check pulse manually each morning – note if irregular or very fast", "Take Rivaroxaban with your evening meal – never skip as this prevents stroke", "Do not stop any heart medication without calling us first"]',
  patient_diagnosis_summary = 'Your heart is beating in an irregular rhythm called atrial fibrillation (AF). This is not immediately dangerous but increases your risk of stroke. We have started a blood-thinning tablet (Rivaroxaban) to protect you from stroke, and a rate-controlling tablet (Bisoprolol) to slow your heart rate.',
  patient_lifestyle_advice = 'Quit smoking – smoking worsens AF. Reduce caffeine (coffee, energy drinks). Reduce alcohol. Reduce salt for blood pressure. Manage work stress.',
  patient_danger_signs = 'Emergency department immediately if: sudden weakness or numbness on one side, sudden speech difficulty, sudden severe headache, severe breathlessness, or if you feel faint or collapse.'
WHERE id = c5a;

-- P-005 Visit 2: Rate control check
UPDATE consultation SET
  history_of_present_illness = 'Review 4 months post-diagnosis. Patient reports some improvement – palpitation episodes feel less intense but resting HR still high (88-95 on diary). Not yet quit smoking. Rivaroxaban taken consistently.',
  physical_exam = 'BP 144/93. HR 88 (irregular). Weight 84 kg.',
  plan = 'Rate control suboptimal. Increase Bisoprolol to 7.5 mg OD. Target resting HR < 80 bpm. Strong smoking cessation advice – refer to cessation programme. Continue Rivaroxaban. Repeat ECG in 3 months.',
  follow_up_timeframe = '3 months',
  follow_up_instructions = 'Repeat ECG. Pulse rate diary. Check for beta-blocker side effects (fatigue, cold hands).',
  home_monitoring = '["Check and record pulse rate daily", "Take Rivaroxaban every evening with food", "Begin smoking cessation programme (referred)"]',
  patient_diagnosis_summary = 'Your heart rate is still too fast – we are increasing the dose of your rate-controlling tablet. Please try the smoking cessation programme as smoking makes your irregular heartbeat harder to control.',
  patient_lifestyle_advice = 'Quit smoking as a priority. Reduce caffeine. Maintain gentle physical activity (walking). Reduce salt.',
  patient_danger_signs = 'Emergency if: sudden weakness, speech difficulty, face drooping (stroke signs), severe breathlessness, collapse.'
WHERE id = c5b;

-- P-006 Visit 1: Post-PCI 6-week review
UPDATE consultation SET
  history_of_present_illness = 'Mrs. Fatma Naguib, 68-year-old retired teacher, 6 weeks post-primary PCI to LAD for anterior STEMI (14 Feb 2023). Patient feels significantly better. No chest pain since procedure. Mild fatigue on exertion (expected). Tolerating all medications well.',
  physical_exam = 'BP 135/85. HR 68. SpO2 97%. PCI entry site (right radial) well-healed. No ankle oedema. Echo: EF 45% (improved from post-MI 40%), no new wall motion abnormalities.',
  plan = 'Excellent progress post-PCI. EF improved to 45%. Continue dual antiplatelet therapy (Aspirin + Clopidogrel) for 12 months total (until Feb 2024). Atorvastatin 80 mg ON, Ramipril 5 mg OD, Carvedilol 3.125 mg BD all continued. Cardiac rehabilitation referral made. Next follow-up in 3 months.',
  follow_up_timeframe = '3 months',
  follow_up_instructions = 'Repeat echo in 3 months. Fasting lipid panel + HbA1c. Do not stop Aspirin or Clopidogrel under any circumstances without calling us.',
  home_monitoring = '["Take ALL heart medications every day without fail", "Walk 10-15 minutes/day increasing gradually with cardiac rehab", "Monitor BP daily", "Return immediately if any chest pain"]',
  patient_diagnosis_summary = 'Six weeks after your heart attack and stent procedure, you are recovering well. Your heart pumping strength has improved. The medicines you are taking are protecting you from another heart attack – please never stop them without speaking to us.',
  patient_lifestyle_advice = 'Cardiac rehabilitation programme: attend all sessions. Gradually increase walking. Mediterranean diet strictly. No smoking. Salt < 3 g/day. Maintain healthy weight.',
  patient_danger_signs = 'Emergency immediately if: any chest pain or pressure, shortness of breath at rest, sudden dizziness or collapse.'
WHERE id = c6a;

-- P-006 Visit 2: 1-year post-MI lipid check
UPDATE consultation SET
  history_of_present_illness = 'Mrs. Naguib at 1-year post-MI review. No angina or cardiac symptoms. Completing cardiac rehabilitation. LDL 2.1 mmol/L (improved from baseline 3.8 but above post-MI target of < 1.8). Dual antiplatelet therapy ongoing (4 months remaining). Good compliance reported.',
  physical_exam = 'BP 132/82. HR 66. Weight 68 kg. No oedema. Cardiovascular exam normal.',
  plan = 'Lipid target not yet achieved. Reinforce strict Atorvastatin 80 mg compliance (especially bedtime timing). Dietary counselling: eliminate saturated fat entirely. LDL recheck in 3 months. Plan Clopidogrel cessation at 12-month mark (Feb 2024).',
  follow_up_timeframe = '3 months',
  follow_up_instructions = 'Confirm Clopidogrel cessation date. Repeat fasting lipid panel. Continue all medications.',
  home_monitoring = '["Continue taking Atorvastatin at bedtime every night – do not skip", "Monitor BP twice weekly", "Maintain cardiac rehab exercise programme"]',
  patient_diagnosis_summary = 'One year after your heart attack, you are doing very well. Your cholesterol is improving but still needs more work. The blood thinning tablet (Clopidogrel) will stop in a few months as planned, but Aspirin continues for life.',
  patient_lifestyle_advice = 'Eliminate cheese, butter, red meat and fried food completely. Replace with fish, chicken, legumes, vegetables. Continue daily walking.',
  patient_danger_signs = 'Emergency if any chest pain, breathlessness at rest, or sudden dizziness.'
WHERE id = c6b;

-- P-006 Visit 3: Clopidogrel cessation
UPDATE consultation SET
  history_of_present_illness = 'Mrs. Naguib at 12-month post-PCI review. No cardiac events. Plan: discontinue Clopidogrel (12-month course completed). LDL now 2.0 mmol/L (near target). No statin side effects.',
  physical_exam = 'BP 128/80. HR 65. Normal exam.',
  plan = 'Clopidogrel discontinued as planned (12 months post-PCI). Continue lifelong: Aspirin 100 mg OD, Atorvastatin 80 mg ON, Ramipril 5 mg OD, Carvedilol 3.125 mg BD. Annual echo + lipid panel. Next visit in 4 months.',
  follow_up_timeframe = '4 months',
  follow_up_instructions = 'Annual echo. Repeat fasting lipid panel. Remind patient Aspirin must continue for life.',
  home_monitoring = '["Continue Aspirin, Atorvastatin, Ramipril and Carvedilol daily", "You have now stopped Clopidogrel – this is correct at this stage", "Continue daily walking and cardiac diet"]',
  patient_diagnosis_summary = 'You have now completed the 12-month double blood-thinning treatment. You will continue on Aspirin for life to protect against another heart attack. Your cholesterol is close to target.',
  patient_lifestyle_advice = 'Continue Mediterranean diet. Maintain healthy weight. Exercise 30 minutes daily. Never smoke.',
  patient_danger_signs = 'Emergency immediately for any chest pain, breathlessness, or sudden weakness.'
WHERE id = c6c;

-- P-006 Visit 4: 2-year post-MI review
UPDATE consultation SET
  history_of_present_illness = '2-year post-MI review. No cardiac events. LDL 1.9 mmol/L (just above target 1.8). EF 45% stable on repeat echo. Good compliance with remaining 4 medications. Annual review.',
  physical_exam = 'BP 124/77. HR 62. Weight 67.5 kg. Normal exam.',
  plan = 'Continue all current medications unchanged. LDL 1.9 – very close to target. Annual echo in 12 months. Annual lipid panel. Pneumococcal and influenza vaccination recommended.',
  follow_up_timeframe = '12 months',
  follow_up_instructions = 'Annual echo and lipid panel. Ensure influenza vaccination. Continue all 4 medications.',
  home_monitoring = '["Take all 4 heart medications daily without exception", "Monitor BP weekly", "Exercise daily – 30 minutes walking"]',
  patient_diagnosis_summary = 'Excellent 2-year progress! Your heart is stable, echo looks good, and cholesterol is almost at target. Continue all medications and your healthy lifestyle.',
  patient_lifestyle_advice = 'Maintain Mediterranean diet and daily exercise. Annual influenza vaccine recommended.',
  patient_danger_signs = 'Emergency for any chest pain, breathlessness, or sudden neurological symptoms.'
WHERE id = c6d;

-- P-007 Visit 1: New HTN + hyperlipidemia
UPDATE consultation SET
  history_of_present_illness = 'Mr. Omar Suleiman, 50-year-old pharmacist, referred after his GP colleague noted BP 158/102 on two separate readings over 4 weeks. Patient had been aware for some time but avoiding medical attention. Asymptomatic. No chest pain or dyspnea. Family history: father stroke, mother DM.',
  physical_exam = 'BP 158/100 (right arm, seated after 5 min rest). HR 78. Weight 95 kg. BMI 29.3. No papilloedema. S2 accentuated (hypertension). ECG: normal sinus rhythm, LVH criteria borderline.',
  plan = 'Hypertension Grade II confirmed. Lipid panel: LDL 3.8 mmol/L (high). Started Amlodipine 5 mg OD and Atorvastatin 20 mg OD. Dietary salt restriction, weight loss targeted. Follow-up 6 months.',
  follow_up_timeframe = '6 months',
  follow_up_instructions = 'Repeat BP and lipid panel. Assess lifestyle changes. Target BP < 140/90.',
  home_monitoring = '["Monitor BP twice daily at the same time – record in diary", "Weigh yourself weekly", "Aim for 10,000 steps daily"]',
  patient_diagnosis_summary = 'You have high blood pressure (Grade 2) and high cholesterol. Both are common and very treatable. Without treatment they increase your risk of heart attack and stroke over time. We have started two tablets to control both.',
  patient_lifestyle_advice = 'Reduce salt to < 5 g/day. Lose 5-10% body weight (target 85-87 kg). Reduce saturated fat. Increase vegetables and fruit. Walk 30 minutes daily.',
  patient_danger_signs = 'Seek emergency care for: severe headache with BP > 180/120, chest pain, or sudden visual changes.'
WHERE id = c7a;

-- P-007 Visit 2: Follow-up
UPDATE consultation SET
  history_of_present_illness = 'Review 5 months post-initiation. BP diary: 149-158/93-100 (still above target). LDL improved to 3.2 from 3.8. Patient reports good medication compliance. Lost 2 kg. Increased walking.',
  physical_exam = 'BP 153/96. HR 76. Weight 93 kg (2 kg loss). No new findings.',
  plan = 'BP still above target 140/90. Consider Amlodipine uptitration to 10 mg at next visit if no response. LDL improving but target < 2.6 not yet reached – continue Atorvastatin, review at next visit. Good lifestyle progress.',
  follow_up_timeframe = '3 months',
  follow_up_instructions = 'Repeat BP diary. Uptitrate Amlodipine to 10 mg if BP > 150/95 persists. Repeat lipid panel in 3 months.',
  home_monitoring = '["Continue BP twice daily diary", "Continue weight loss programme", "Take medications every morning without fail"]',
  patient_diagnosis_summary = 'Your blood pressure is coming down slowly and your cholesterol has improved. You are on the right track. We may need to increase your blood pressure tablet at the next visit to get it fully under control.',
  patient_lifestyle_advice = 'Continue salt reduction and walking. Target weight 88-90 kg over next 6 months.',
  patient_danger_signs = 'Emergency for severe headache + very high BP, chest pain, or sudden neurological symptoms.'
WHERE id = c7b;

-- P-008 Visit 1: Hypertensive cardiomyopathy
UPDATE consultation SET
  history_of_present_illness = 'Mrs. Rania Fawzy, 43-year-old graphic designer, referred from GP with persistent headaches and BP 150/96 on multiple readings. Also notes occasional exertional palpitations. High-stress job. Father has hypertension from age 40. ECG at GP: LVH voltage criteria present.',
  physical_exam = 'BP 150/96. HR 79. SpO2 99%. Weight 70 kg. BMI 25.7. S2 accentuated. ECG: LVH. Echo ordered: concentric LVH, EF 62%, Grade I diastolic dysfunction confirmed.',
  plan = 'Diagnosis: Hypertensive Cardiomyopathy with LVH and Grade I diastolic dysfunction. Goal: BP < 130/80. Started Valsartan 160 mg OD and Nebivolol 5 mg OD. Annual echo monitoring. 24-hr ambulatory BP monitoring ordered.',
  follow_up_timeframe = '6 months',
  follow_up_instructions = 'Repeat echo in 6 months to monitor LVH regression. Repeat 24-hr BP. Assess medication tolerance.',
  home_monitoring = '["Take Valsartan and Nebivolol every morning", "Monitor BP twice daily", "Try to incorporate 20-30 minutes relaxation/yoga daily to reduce stress"]',
  patient_diagnosis_summary = 'Your high blood pressure has been present long enough to thicken the walls of your heart – this is called left ventricular hypertrophy. It is reversible with good blood pressure control. The two tablets we have started will control your BP and allow the heart wall to return to normal thickness over months.',
  patient_lifestyle_advice = 'Stress management is essential – consider mindfulness or yoga. Reduce working hours if possible. Maintain regular moderate exercise (avoid high-intensity). Salt < 4 g/day. Maintain healthy weight.',
  patient_danger_signs = 'Emergency for severe headache with very high BP, chest pain, or sudden breathlessness.'
WHERE id = c8a;

-- P-008 Visit 2: Echo follow-up
UPDATE consultation SET
  history_of_present_illness = '6-month review. BP diary significantly improved: 140-148/88-95. Headaches resolved. Tolerating medications well. Repeat echo results reviewed.',
  physical_exam = 'BP 144/91. HR 75. Weight 70 kg unchanged. ECG: LVH criteria still present but voltage reduced.',
  plan = 'Echo: LVH stable – no progression, early signs of regression. Good BP response to treatment. Continue Valsartan 160 mg OD and Nebivolol 5 mg OD unchanged. Target BP < 130/80 – consider adding indapamide at next visit if not at target. Next echo in 12 months.',
  follow_up_timeframe = '12 months',
  follow_up_instructions = 'Annual echo. Ambulatory BP monitoring annually. Repeat lipid panel. Consider additional agent if BP > 140/90.',
  home_monitoring = '["Continue daily BP monitoring", "Continue medications every morning", "30 minutes exercise daily – walking or cycling"]',
  patient_diagnosis_summary = 'Good news – your heart wall thickening has stabilised and is beginning to reverse. Your blood pressure is better controlled. Continue your medications and healthy lifestyle.',
  patient_lifestyle_advice = 'Continue stress management programme. Regular aerobic exercise (30 min, 5 days/week). Mediterranean diet.',
  patient_danger_signs = 'Emergency for sudden severe headache, chest pain, or any neurological symptoms.'
WHERE id = c8b;

-- P-009 Visit 1: Acute pericarditis
UPDATE consultation SET
  history_of_present_illness = 'Mr. Youssef Abdel-Aziz, 65-year-old retired teacher, presents with sudden onset sharp left-sided chest pain worsening on inspiration and lying flat. Onset 2 days ago following a viral upper respiratory tract infection 10 days prior. Relieved by sitting forward. No radiation. Mild fever (38°C). Background: T2DM on Metformin, well-controlled.',
  physical_exam = 'BP 118/76. HR 80 (sinus). Temp 38.1°C. Pericardial friction rub audible at left lower sternal border. ECG: diffuse saddle-shaped ST elevation, PR depression. Echo: small pericardial effusion (5 mm) – no tamponade. CRP 48 mg/L.',
  plan = 'Diagnosis: Acute Pericarditis (viral aetiology suspected). Hospitalisation offered but patient refused. Started Ibuprofen 600 mg TDS × 3 months (with PPI cover), Colchicine 0.5 mg BD × 3 months. Bed rest initially, avoid exercise. Follow-up in 4 weeks. Continue Metformin. Monitor RFT on NSAIDs.',
  follow_up_timeframe = '4 weeks',
  follow_up_instructions = 'Repeat echo in 4 weeks to check effusion. CRP monitoring. Avoid strenuous activity until fully resolved.',
  home_monitoring = '["Rest as much as possible for first 2 weeks", "Take all medications with food", "Monitor temperature daily", "Return immediately if chest pain worsens, breathing difficulty, or fever > 39°C"]',
  patient_diagnosis_summary = 'The lining around your heart (pericardium) is inflamed – probably from a viral infection. This is usually temporary and fully curable. We have given you anti-inflammatory tablets for 3 months. You must rest and avoid exertion until we confirm it has healed.',
  patient_lifestyle_advice = 'Complete bed rest initially. Gradually return to light activities as symptoms resolve. No sport or heavy exertion for 3 months until cleared.',
  patient_danger_signs = 'Emergency if: chest pain suddenly much worse, difficulty breathing lying down, feeling faint, rapid heartbeat, or high fever.'
WHERE id = c9a;

-- P-009 Visit 2: Post-pericarditis follow-up
UPDATE consultation SET
  history_of_present_illness = '3-month follow-up. Patient completely asymptomatic – no chest pain since 3 weeks after starting treatment. Completed full course of Ibuprofen and Colchicine. Feeling well. Blood sugar well-controlled on Metformin 1000 mg BD.',
  physical_exam = 'BP 120/78. HR 70. Afebrile. No pericardial rub. Echo: completely clear, no effusion. CRP 0.4 mg/L (normal). ECG: normal sinus rhythm, resolved ST changes.',
  plan = 'Pericarditis fully resolved. Discontinue Ibuprofen and Colchicine. Continue Metformin. Normal activities may be resumed. Annual review for T2DM.',
  follow_up_timeframe = '12 months',
  follow_up_instructions = 'Annual HbA1c, RFT, and lipid panel. Annual cardiology review.',
  home_monitoring = '["Continue Metformin with meals as usual", "Resume normal physical activity gradually", "Monitor blood sugar as before"]',
  patient_diagnosis_summary = 'Your pericarditis is completely cured! The inflammation around your heart has fully resolved. You can return to all normal activities. Your diabetes is also well-controlled. See you in 12 months.',
  patient_lifestyle_advice = 'Resume normal activity including exercise. Maintain healthy diet for diabetes management. Annual checkups.',
  patient_danger_signs = 'Return if chest pain or breathlessness returns. Seek emergency care for any sudden cardiac symptoms.'
WHERE id = c9b;

-- P-010 Visit 1: Benign palpitations
UPDATE consultation SET
  history_of_present_illness = 'Ms. Nour El-Din Gamal, 35-year-old software engineer, presents with 6-week history of recurrent palpitations – described as irregular/skipped beats, especially at rest and during stressful work periods. No syncope or presyncope. No chest pain. No dyspnea. High-stress job (deadline-driven). Caffeine intake: 4-6 cups coffee/day. Sleeping 5-6 hours/night.',
  physical_exam = 'BP 118/76. HR 88. Regular rhythm. SpO2 99%. Weight 58 kg. Normal cardiovascular exam. No goitre. ECG: sinus rhythm, occasional isolated PVC.',
  plan = '24-hour Holter: sinus rhythm throughout, isolated PVCs 0.8% of beats (benign threshold < 10%). Echo: normal EF 65%, no structural abnormality. TSH 1.8 (normal). Diagnosis: Benign palpitations, likely anxiety and excess caffeine. Started Bisoprolol 2.5 mg OD for symptom control. Lifestyle modification essential. Follow-up 6 months.',
  follow_up_timeframe = '6 months',
  follow_up_instructions = 'Reassess palpitation frequency and anxiety. Holter if symptoms worsen. Consider mental health referral if anxiety persists.',
  home_monitoring = '["Note when palpitations occur – time, activity, stress level, caffeine intake", "Reduce coffee to maximum 1-2 cups/day", "Sleep minimum 7-8 hours per night", "Try mindfulness app daily"]',
  patient_diagnosis_summary = 'Your palpitations are from occasional extra heartbeats (PVCs) which are harmless and very common. Your heart structure and function are completely normal. The main triggers appear to be excess caffeine, stress, and inadequate sleep. The low-dose beta-blocker tablet will help reduce the sensation.',
  patient_lifestyle_advice = 'Reduce caffeine drastically (max 1 cup/day). Prioritise 8 hours sleep. Daily stress reduction: yoga, mindfulness, or walking. Limit screen time before bed. Regular meal times.',
  patient_danger_signs = 'Return if: palpitations become more frequent or associated with chest pain, dizziness, or fainting. Emergency if you feel your heart racing very fast (> 150 bpm felt) or lose consciousness.'
WHERE id = c10a;


/* ================================================================
   PART 2 – CARE GOALS (doctor user_id = 3 for created_by)
   ================================================================ */

INSERT INTO patient_care_goal (patient_id, created_by_user_id, metric, target, current_value, status) VALUES
-- P-003 Khaled Hassan
(p3, 3, 'Blood Pressure',        '< 140/90 mmHg',    '152/94 mmHg',  'on-track'),
(p3, 3, 'LDL Cholesterol',       '< 2.6 mmol/L',     '3.2 mmol/L',   'off-track'),
(p3, 3, 'Angina frequency',      '0 episodes/month', '1×/month',      'on-track'),
(p3, 3, 'Body weight',           '< 88 kg',          '90 kg',         'on-track'),
-- P-004 Maha Ibrahim
(p4, 3, 'Blood Pressure',        '< 130/80 mmHg',    '138/86 mmHg',  'on-track'),
(p4, 3, 'HbA1c',                 '< 7.0%',           '7.8%',          'off-track'),
(p4, 3, 'Body weight (fluid)',   'Stable ± 1 kg',    '75 kg',         'on-track'),
(p4, 3, 'BNP',                   '< 100 pg/mL',      '310 pg/mL',     'off-track'),
-- P-005 Tarek Mansour
(p5, 3, 'Resting heart rate',    '60–80 bpm',        '88 bpm',        'off-track'),
(p5, 3, 'Blood Pressure',        '< 140/90 mmHg',    '144/93 mmHg',  'on-track'),
(p5, 3, 'Smoking',               'Quit completely',  'Current smoker','off-track'),
-- P-006 Fatma Naguib
(p6, 3, 'LDL Cholesterol',       '< 1.8 mmol/L',     '1.9 mmol/L',   'on-track'),
(p6, 3, 'Blood Pressure',        '< 130/80 mmHg',    '124/77 mmHg',  'achieved'),
(p6, 3, 'Daily exercise',        '30 min walking/day','30 min/day',   'achieved'),
-- P-007 Omar Suleiman
(p7, 3, 'Blood Pressure',        '< 140/90 mmHg',    '153/96 mmHg',  'off-track'),
(p7, 3, 'LDL Cholesterol',       '< 2.6 mmol/L',     '3.2 mmol/L',   'off-track'),
(p7, 3, 'Body weight',           '< 90 kg',          '93 kg',         'on-track'),
-- P-008 Rania Fawzy
(p8, 3, 'Blood Pressure',        '< 130/80 mmHg',    '144/91 mmHg',  'off-track'),
(p8, 3, 'LVH regression',        'Normal wall thickness','LVH present','on-track'),
(p8, 3, 'Stress management',     'Daily practice',    'Weekly',        'on-track'),
-- P-009 Youssef Abdel-Aziz
(p9, 3, 'HbA1c',                 '< 7.0%',           '6.7%',          'achieved'),
(p9, 3, 'Blood Pressure',        '< 130/80 mmHg',    '122/78 mmHg',  'achieved'),
-- P-010 Nour El-Din Gamal
(p10, 3, 'Caffeine intake',      '≤ 1 cup coffee/day','Reducing',    'on-track'),
(p10, 3, 'Sleep',                '7–8 hours/night',  '6 hrs/night',   'off-track'),
(p10, 3, 'Palpitation frequency','< 1 episode/week', '2–3×/week',     'on-track');


/* ================================================================
   PART 3 – PAST APPOINTMENTS (completed)
   ================================================================ */

INSERT INTO appointment (confirmation_code, patient_id, doctor_id, scheduled_at, visit_type, status, reason) VALUES
('APC-P003P1', p3, doc, '2023-10-05 09:00:00+02', 'new',       'completed', 'Initial cardiac evaluation – chest pain'),
('APC-P003P2', p3, doc, '2023-12-12 09:30:00+02', 'follow-up', 'completed', 'BP and angina review'),
('APC-P003P3', p3, doc, '2024-02-20 08:45:00+02', 'follow-up', 'completed', 'Lipid panel review'),
('APC-P003P4', p3, doc, '2024-06-18 09:00:00+02', 'follow-up', 'completed', 'Quarterly BP and angina review'),
('APC-P004P1', p4, doc, '2023-11-08 10:00:00+02', 'new',       'completed', 'Dyspnea evaluation'),
('APC-P004P2', p4, doc, '2024-01-22 09:30:00+02', 'follow-up', 'completed', 'HF and DM review'),
('APC-P004P3', p4, doc, '2024-04-10 10:00:00+02', 'follow-up', 'completed', 'Weight gain - fluid assessment'),
('APC-P005P1', p5, doc, '2023-09-20 11:00:00+02', 'new',       'completed', 'Palpitations – AF workup'),
('APC-P005P2', p5, doc, '2024-01-10 10:30:00+02', 'follow-up', 'completed', 'AF rate control review'),
('APC-P006P1', p6, doc, '2023-03-05 09:00:00+02', 'post-procedure', 'completed', 'Post-PCI 6-week review'),
('APC-P006P2', p6, doc, '2023-06-14 09:30:00+02', 'follow-up', 'completed', 'Lipid control 1-year post-MI'),
('APC-P006P3', p6, doc, '2023-10-18 10:00:00+02', 'follow-up', 'completed', 'Clopidogrel cessation review'),
('APC-P006P4', p6, doc, '2024-02-06 09:00:00+02', 'follow-up', 'completed', '2-year post-MI annual review'),
('APC-P007P1', p7, doc, '2023-08-15 10:00:00+02', 'new',       'completed', 'Hypertension initial assessment'),
('APC-P007P2', p7, doc, '2024-01-20 09:30:00+02', 'follow-up', 'completed', 'BP and lipid follow-up'),
('APC-P008P1', p8, doc, '2023-07-10 10:00:00+02', 'new',       'completed', 'Hypertension and echo evaluation'),
('APC-P008P2', p8, doc, '2023-11-28 09:30:00+02', 'follow-up', 'completed', 'Echo 6-month follow-up'),
('APC-P009P1', p9, doc, '2023-04-20 11:00:00+02', 'urgent',    'completed', 'Acute chest pain – pericarditis'),
('APC-P009P2', p9, doc, '2023-07-20 10:00:00+02', 'follow-up', 'completed', 'Pericarditis 3-month check'),
('APC-P010P1', p10, doc,'2024-03-20 10:00:00+02', 'new',       'completed', 'Palpitations evaluation');


/* ================================================================
   PART 4 – DOSE LOGS (last 45 days, realistic compliance)
   Patients:
     P-003 Khaled:  ~93% (misses ~3 days/month)
     P-004 Maha:    ~85% (misses ~7 days/month)
     P-005 Tarek:   ~90% (misses ~4 days/month)
     P-006 Fatma:   ~98% (misses ~1 day/month)
     P-007 Omar:    ~86% (misses ~6 days/month)
     P-008 Rania:   ~92% (misses ~4 days/month)
     P-009 Youssef: ~97% (misses ~1 day/month)
     P-010 Nour:    ~84% (misses ~7 days/month)
   ================================================================ */

FOR v_day IN SELECT generate_series(CURRENT_DATE - 44, CURRENT_DATE - 1, '1 day'::INTERVAL)::DATE LOOP

  -- P-003: skip ~7% (day mod 14 = 0)
  v_skip := (EXTRACT(DOY FROM v_day)::INT % 14 = 0);
  FOR v_med IN SELECT unnest(ARRAY[m3_amlo, m3_ator, m3_biso, m3_asp]) LOOP
    INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
    VALUES (v_med, u3, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '8 hours', v_skip);
  END LOOP;

  -- P-004: skip ~15% (every 6-7 days)
  v_skip := (EXTRACT(DOY FROM v_day)::INT % 7 IN (0, 3));
  FOR v_med IN SELECT unnest(ARRAY[m4_lisi, m4_furo, m4_carv, m4_metf]) LOOP
    INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
    VALUES (v_med, u4, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '7 hours', v_skip);
  END LOOP;

  -- P-005: skip ~10% (weekends mostly)
  v_skip := (EXTRACT(DOW FROM v_day)::INT IN (6, 0) AND EXTRACT(DOY FROM v_day)::INT % 3 = 0);
  FOR v_med IN SELECT unnest(ARRAY[m5_riva, m5_biso, m5_amlo]) LOOP
    INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
    VALUES (v_med, u5, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '8 hours', v_skip);
  END LOOP;

  -- P-006: skip ~2% (very rare)
  v_skip := (EXTRACT(DOY FROM v_day)::INT % 45 = 0);
  FOR v_med IN SELECT unnest(ARRAY[m6_asp, m6_ator, m6_rami, m6_carv]) LOOP
    INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
    VALUES (v_med, u6, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '8 hours', v_skip);
  END LOOP;

  -- P-007: skip ~14% (forgets on busy weekdays)
  v_skip := (EXTRACT(DOY FROM v_day)::INT % 7 IN (1, 4));
  FOR v_med IN SELECT unnest(ARRAY[m7_amlo, m7_ator]) LOOP
    INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
    VALUES (v_med, u7, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '8 hours', v_skip);
  END LOOP;

  -- P-008: skip ~8%
  v_skip := (EXTRACT(DOY FROM v_day)::INT % 12 = 0);
  FOR v_med IN SELECT unnest(ARRAY[m8_vals, m8_nebi]) LOOP
    INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
    VALUES (v_med, u8, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '8 hours', v_skip);
  END LOOP;

  -- P-009: skip ~3%
  v_skip := (EXTRACT(DOY FROM v_day)::INT % 33 = 0);
  INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
  VALUES (m9_metf, u9, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '8 hours', v_skip);

  -- P-010: skip ~16% (irregular taker)
  v_skip := (EXTRACT(DOY FROM v_day)::INT % 6 IN (0, 3));
  INSERT INTO dose_log (medication_id, patient_id, taken_at, skipped)
  VALUES (m10_biso, u10, v_day::TIMESTAMP WITH TIME ZONE + INTERVAL '8 hours', v_skip);

END LOOP;


/* ================================================================
   PART 5 – LINK VITALS TO CONSULTATIONS
   (update the vital readings that match consultation dates)
   ================================================================ */

UPDATE vital_reading SET consultation_id = c3a WHERE patient_id = p3 AND date = '2023-10-05';
UPDATE vital_reading SET consultation_id = c3b WHERE patient_id = p3 AND date = '2023-12-12';
UPDATE vital_reading SET consultation_id = c3c WHERE patient_id = p3 AND date = '2024-02-20';
UPDATE vital_reading SET consultation_id = c3d WHERE patient_id = p3 AND date = '2024-06-18';
UPDATE vital_reading SET consultation_id = c4a WHERE patient_id = p4 AND date = '2023-11-08';
UPDATE vital_reading SET consultation_id = c4b WHERE patient_id = p4 AND date = '2024-01-22';
UPDATE vital_reading SET consultation_id = c4c WHERE patient_id = p4 AND date = '2024-04-10';
UPDATE vital_reading SET consultation_id = c5a WHERE patient_id = p5 AND date = '2023-09-20';
UPDATE vital_reading SET consultation_id = c5b WHERE patient_id = p5 AND date = '2024-01-10';
UPDATE vital_reading SET consultation_id = c6a WHERE patient_id = p6 AND date = '2023-03-05';
UPDATE vital_reading SET consultation_id = c6b WHERE patient_id = p6 AND date = '2023-06-14';
UPDATE vital_reading SET consultation_id = c6c WHERE patient_id = p6 AND date = '2023-10-18';
UPDATE vital_reading SET consultation_id = c6d WHERE patient_id = p6 AND date = '2024-02-06';
UPDATE vital_reading SET consultation_id = c7a WHERE patient_id = p7 AND date = '2023-08-15';
UPDATE vital_reading SET consultation_id = c7b WHERE patient_id = p7 AND date = '2024-01-20';
UPDATE vital_reading SET consultation_id = c8a WHERE patient_id = p8 AND date = '2023-07-10';
UPDATE vital_reading SET consultation_id = c8b WHERE patient_id = p8 AND date = '2023-11-28';
UPDATE vital_reading SET consultation_id = c9a WHERE patient_id = p9 AND date = '2023-04-20';
UPDATE vital_reading SET consultation_id = c9b WHERE patient_id = p9 AND date = '2023-07-20';
UPDATE vital_reading SET consultation_id = c10a WHERE patient_id = p10 AND date = '2024-03-20';

END $$;
