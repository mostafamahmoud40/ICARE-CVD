-- =============================================================
-- ICARE-CVD  —  Demo Patient Seed  (8 patients)
-- Password for ALL patients:  Patient123!
-- Run once via:
--   docker exec icare-cvd-postgres psql -U postgres -d icare_cvd -f /tmp/seed_patients.sql
-- =============================================================

DO $$
DECLARE
  -- user IDs
  u3  INTEGER; u4  INTEGER; u5  INTEGER; u6  INTEGER;
  u7  INTEGER; u8  INTEGER; u9  INTEGER; u10 INTEGER;
  -- patient UUIDs
  p3  UUID; p4  UUID; p5  UUID; p6  UUID;
  p7  UUID; p8  UUID; p9  UUID; p10 UUID;
  -- doctors
  doc_cardio UUID := 'f29232bf-77d3-44b8-a86e-5b5486c16a69';
  -- argon2id hash of "Patient123!"
  pw  TEXT := '$argon2id$v=19$m=65536,t=3,p=4$hxdQwLvT/XXsvPIfl0xJvw$E8MA8s/hkxQlwryR1nB4QMFI/WXQ86c0G31mxCg6+kk';
BEGIN

/* ================================================================
   P-003  Khaled Hassan  |  62 yo male  |  HIGH RISK
   CAD + Hypertension Grade II  |  Cardiologist follow-up
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Khaled Hassan','khaled.hassan@icare-demo.com','+20 111 234 5678','patient',pw)
RETURNING id INTO u3;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-003',u3,'1962-03-15','male','O+','Heliopolis, Cairo, Egypt',
  175.0,92.0,'married','Civil Engineer',
  'former-10','none','1-2','high_salt','moderate','high')
RETURNING id INTO p3;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u3,'chest-pain');

INSERT INTO allergy (user_id,category,allergen,reaction) VALUES
  (u3,'drug','Penicillin','Skin rash and urticaria');

INSERT INTO family_history (user_id,has_family_history,relationship,condition) VALUES
  (u3,true,'Father','Myocardial Infarction – died age 58'),
  (u3,true,'Brother','Hypertension');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p3,'I10','Hypertension Grade II','cardiac',true,'primary','moderate','confirmed','chronic','2019-06-01','2019-06-15 10:00:00+02',
   'Persistent resting BP > 160/100. Initiated Amlodipine. Salt restriction advised.'),
  (p3,'I20.9','Stable Angina Pectoris','cardiac',true,'secondary','moderate','confirmed','chronic','2021-03-10','2021-03-10 09:00:00+02',
   'Exertional chest pain CCS II. Positive ETT. Added Bisoprolol and Aspirin.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u3,'Amlodipine','10 mg','once-daily','antihypertensives','active','Take in the morning with water.',ARRAY['morning']::time_of_day[],92,'2019-06-15','2019-06-15 10:00:00+02'),
  (u3,'Aspirin','75 mg','once-daily','antiplatelets','active','Take after breakfast.',ARRAY['morning']::time_of_day[],98,'2021-03-10','2021-03-10 09:00:00+02'),
  (u3,'Atorvastatin','40 mg','once-daily','statins','active','Take at bedtime.',ARRAY['evening']::time_of_day[],88,'2021-03-10','2021-03-10 09:00:00+02'),
  (u3,'Bisoprolol','5 mg','once-daily','antiarrhythmics','active','Do not stop suddenly. Take in the morning.',ARRAY['morning']::time_of_day[],95,'2021-03-10','2021-03-10 09:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p3,'2023-10-05','09:00','clinic',168,104,82,96,'2023-10-05 09:30:00+02'),
  (p3,'2023-12-12','09:30','clinic',162,100,80,97,'2023-12-12 09:45:00+02'),
  (p3,'2024-02-20','08:45','clinic',158,98, 78,97,'2024-02-20 09:00:00+02'),
  (p3,'2024-06-18','09:00','clinic',152,94, 77,98,'2024-06-18 09:30:00+02'),
  (p3,'2024-10-14','10:00','home', 148,92, 76,98,'2024-10-14 10:15:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p3,'Total Cholesterol','6.2','mmol/L','< 5.2','high','2024-02-21 10:00:00+02','Dr. Demo Doctor'),
  (p3,'LDL Cholesterol','4.1','mmol/L','< 2.6','high','2024-02-21 10:00:00+02','Dr. Demo Doctor'),
  (p3,'HDL Cholesterol','0.9','mmol/L','> 1.0','low','2024-02-21 10:00:00+02','Dr. Demo Doctor'),
  (p3,'Triglycerides','2.8','mmol/L','< 1.7','high','2024-02-21 10:00:00+02','Dr. Demo Doctor'),
  (p3,'Creatinine','1.1','mg/dL','0.7–1.3','normal','2024-02-21 10:00:00+02','Dr. Demo Doctor'),
  (p3,'Fasting Blood Glucose','5.8','mmol/L','3.9–5.6','high','2024-02-21 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p3,doc_cardio,'new','Exertional chest tightness and uncontrolled BP','BP 168/104. ETT ordered – positive at moderate effort. Diagnosed stable angina. Started Bisoprolol + Aspirin.','completed','2023-10-05 09:00:00+02','2023-10-05 09:40:00+02',40),
  (p3,doc_cardio,'follow-up','BP review and angina frequency assessment','BP 162/100. Angina 2–3×/week. Continue medications, dose adjustment discussed.','completed','2023-12-12 09:30:00+02','2023-12-12 10:00:00+02',30),
  (p3,doc_cardio,'follow-up','Lipid panel results review','LDL 4.1 – increased Atorvastatin to 40 mg. Dietary counselling given.','completed','2024-02-20 08:45:00+02','2024-02-20 09:20:00+02',35),
  (p3,doc_cardio,'follow-up','Quarterly review – BP and angina stable','BP 152/94. Angina now 1×/month. Good response to therapy.','completed','2024-06-18 09:00:00+02','2024-06-18 09:35:00+02',35);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P003A',p3,doc_cardio,'2026-07-15 10:00:00+02','follow-up','scheduled','Quarterly BP and angina review');


/* ================================================================
   P-004  Maha Ibrahim  |  55 yo female  |  HIGH RISK
   Heart Failure NYHA II + T2DM + HTN
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Maha Ibrahim','maha.ibrahim@icare-demo.com','+20 122 876 4321','patient',pw)
RETURNING id INTO u4;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-004',u4,'1969-07-22','female','B+','Nasr City, Cairo, Egypt',
  160.0,75.0,'married','School Teacher',
  'never','none','rarely-monthly','high_both','high','high')
RETURNING id INTO p4;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u4,'dyspnea');

INSERT INTO allergy (user_id,category,allergen,reaction) VALUES
  (u4,'drug','ACE Inhibitors (Captopril)','Dry persistent cough');

INSERT INTO family_history (user_id,has_family_history,relationship,condition) VALUES
  (u4,true,'Mother','Type 2 Diabetes Mellitus'),
  (u4,true,'Sister','Ischemic Stroke at age 52');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p4,'I50.20','Heart Failure with Reduced EF (HFrEF) – NYHA Class II','cardiac',true,'primary','moderate','confirmed','chronic','2020-11-01','2020-11-15 11:00:00+02',
   'EF 38% on echo. Exertional dyspnea on moderate activity. BNP 380 pg/mL. Started on Carvedilol + Furosemide.'),
  (p4,'E11','Type 2 Diabetes Mellitus','diabetes',true,'secondary','moderate','confirmed','chronic','2018-03-05','2018-03-05 10:00:00+02',
   'HbA1c 8.4% at diagnosis. Started Metformin 500 mg BD.'),
  (p4,'I10','Hypertension','cardiac',true,'secondary','mild','confirmed','chronic','2017-08-10','2017-08-10 09:00:00+02',
   'Discovered incidentally at routine check. BP 148/92. Managed with Lisinopril.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u4,'Furosemide','40 mg','once-daily','diuretics','active','Take in the morning. Monitor weight daily.',ARRAY['morning']::time_of_day[],90,'2020-11-15','2020-11-15 11:00:00+02'),
  (u4,'Carvedilol','6.25 mg','twice-daily','antiarrhythmics','active','Take with food morning and evening.',ARRAY['morning','evening']::time_of_day[],85,'2020-11-15','2020-11-15 11:00:00+02'),
  (u4,'Metformin','500 mg','twice-daily','diabetes_medications','active','Take with meals.',ARRAY['morning','evening']::time_of_day[],88,'2018-03-05','2018-03-05 10:00:00+02'),
  (u4,'Lisinopril','10 mg','once-daily','antihypertensives','active','Take in the morning.',ARRAY['morning']::time_of_day[],92,'2017-08-10','2017-08-10 09:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p4,'2023-11-08','10:00','clinic',148,92,76,95,'2023-11-08 10:30:00+02'),
  (p4,'2024-01-22','09:30','clinic',142,88,74,96,'2024-01-22 09:45:00+02'),
  (p4,'2024-04-10','10:00','clinic',138,86,72,96,'2024-04-10 10:30:00+02'),
  (p4,'2024-07-16','09:00','home', 135,84,71,97,'2024-07-16 09:15:00+02'),
  (p4,'2024-11-05','10:00','clinic',133,82,70,97,'2024-11-05 10:30:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p4,'HbA1c','7.8','%','< 7.0','high','2024-04-11 10:00:00+02','Dr. Demo Doctor'),
  (p4,'Fasting Blood Glucose','8.2','mmol/L','3.9–5.6','high','2024-04-11 10:00:00+02','Dr. Demo Doctor'),
  (p4,'BNP','310','pg/mL','< 100','high','2024-04-11 10:00:00+02','Dr. Demo Doctor'),
  (p4,'Creatinine','1.2','mg/dL','0.6–1.1','high','2024-04-11 10:00:00+02','Dr. Demo Doctor'),
  (p4,'Potassium','4.1','mEq/L','3.5–5.0','normal','2024-04-11 10:00:00+02','Dr. Demo Doctor'),
  (p4,'Total Cholesterol','5.4','mmol/L','< 5.2','high','2024-04-11 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p4,doc_cardio,'new','Shortness of breath on climbing one flight of stairs','New HF diagnosis. Echo: EF 38%, LVH, dilated LV. BNP 380. Started Carvedilol + Furosemide.','completed','2023-11-08 10:00:00+02','2023-11-08 11:00:00+02',60),
  (p4,doc_cardio,'follow-up','Dyspnea slightly improved, blood sugar still high','Symptoms NYHA II stable. HbA1c 8.2% – increase Metformin to 1000 mg BD.','completed','2024-01-22 09:30:00+02','2024-01-22 10:10:00+02',40),
  (p4,doc_cardio,'follow-up','Weight gained 2 kg in 2 weeks','Possible fluid retention. Furosemide doubled temporarily. Weight chart reviewed.','completed','2024-04-10 10:00:00+02','2024-04-10 10:45:00+02',45);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P004A',p4,doc_cardio,'2026-07-22 09:30:00+02','follow-up','scheduled','HF and DM quarterly review');


/* ================================================================
   P-005  Tarek Mansour  |  48 yo male  |  MODERATE RISK
   Atrial Fibrillation (persistent) + Hypertension
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Tarek Mansour','tarek.mansour@icare-demo.com','+20 100 555 7890','patient',pw)
RETURNING id INTO u5;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-005',u5,'1976-11-08','male','A+','Maadi, Cairo, Egypt',
  178.0,85.0,'married','Accountant',
  'current-10','rarely','1-2','high_fat','high','moderate')
RETURNING id INTO p5;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u5,'palpitations');

INSERT INTO family_history (user_id,has_family_history,relationship,condition) VALUES
  (u5,true,'Father','Hypertension and Atrial Fibrillation');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p5,'I48.1','Persistent Atrial Fibrillation','cardiac',true,'primary','moderate','confirmed','chronic','2022-09-15','2022-09-15 12:00:00+02',
   'Holter: AF 68% of recording time. Rate-controlled with Bisoprolol. CHA₂DS₂-VASc score 2 – anticoagulation started.'),
  (p5,'I10','Hypertension','cardiac',true,'secondary','mild','confirmed','chronic','2020-04-01','2020-04-01 10:00:00+02',
   'BP 145/95 on multiple readings. Started on lifestyle modification first, then Amlodipine.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u5,'Rivaroxaban','20 mg','once-daily','anticoagulants','active','Take with the evening meal.',ARRAY['evening']::time_of_day[],94,'2022-09-20','2022-09-20 12:00:00+02'),
  (u5,'Bisoprolol','5 mg','once-daily','antiarrhythmics','active','Take in the morning for rate control.',ARRAY['morning']::time_of_day[],90,'2022-09-15','2022-09-15 12:00:00+02'),
  (u5,'Amlodipine','5 mg','once-daily','antihypertensives','active','Take in the morning.',ARRAY['morning']::time_of_day[],87,'2020-06-10','2020-06-10 10:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p5,'2023-09-20','11:00','clinic',148,96,92,98,'2023-09-20 11:30:00+02'),
  (p5,'2024-01-10','10:30','clinic',144,93,88,98,'2024-01-10 10:45:00+02'),
  (p5,'2024-05-08','09:00','clinic',142,91,85,99,'2024-05-08 09:30:00+02'),
  (p5,'2024-09-17','11:00','home', 140,90,83,99,'2024-09-17 11:15:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p5,'TSH','1.8','mIU/L','0.4–4.0','normal','2024-01-11 10:00:00+02','Dr. Demo Doctor'),
  (p5,'Total Cholesterol','5.8','mmol/L','< 5.2','high','2024-01-11 10:00:00+02','Dr. Demo Doctor'),
  (p5,'LDL Cholesterol','3.6','mmol/L','< 2.6','high','2024-01-11 10:00:00+02','Dr. Demo Doctor'),
  (p5,'Creatinine','0.9','mg/dL','0.7–1.3','normal','2024-01-11 10:00:00+02','Dr. Demo Doctor'),
  (p5,'Haemoglobin','14.8','g/dL','13.5–17.5','normal','2024-01-11 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p5,doc_cardio,'new','Recurrent palpitations and irregular heartbeat for 3 months','ECG: Irregular rhythm, no P-waves – AF confirmed. Holter ordered. CHA₂DS₂-VASc 2. Started anticoagulation.','completed','2023-09-20 11:00:00+02','2023-09-20 12:00:00+02',60),
  (p5,doc_cardio,'follow-up','Rate control assessment – HR still elevated','Resting HR 88. Increase Bisoprolol to 7.5 mg. Encourage smoking cessation.','completed','2024-01-10 10:30:00+02','2024-01-10 11:05:00+02',35);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P005A',p5,doc_cardio,'2026-08-05 11:00:00+02','follow-up','scheduled','AF rate control and anticoagulation review');


/* ================================================================
   P-006  Fatma Naguib  |  70 yo female  |  HIGH RISK
   Post-STEMI (anterior, 2022) + Hypertension + Hyperlipidemia
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Fatma Naguib','fatma.naguib@icare-demo.com','+20 102 334 9988','patient',pw)
RETURNING id INTO u6;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-006',u6,'1954-05-30','female','AB+','Dokki, Giza, Egypt',
  158.0,68.0,'widowed','Retired',
  'former-20','none','1-2','high_salt','low','high')
RETURNING id INTO p6;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u6,'post-discharge');

INSERT INTO allergy (user_id,category,allergen,reaction) VALUES
  (u6,'drug','Ibuprofen','Gastric bleeding risk – NSAID intolerance');

INSERT INTO family_history (user_id,has_family_history,relationship,condition) VALUES
  (u6,true,'Mother','Hypertension and heart failure'),
  (u6,true,'Husband','STEMI – deceased');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p6,'I21.0','Acute Anterior STEMI (2022) – post-PCI','cardiac',true,'primary','severe','confirmed','chronic','2022-02-14','2022-02-14 08:00:00+02',
   'Anterior STEMI. Emergent PCI to LAD. Drug-eluting stent placed. EF 45% post-procedure. Dual antiplatelet therapy for 12 months then Aspirin lifelong.'),
  (p6,'I10','Hypertension','cardiac',true,'secondary','moderate','confirmed','chronic','2015-01-10','2015-01-10 10:00:00+02',
   'Long-standing hypertension. Current BP well-controlled on Ramipril.'),
  (p6,'E78.5','Hyperlipidemia','cardiac',true,'secondary','moderate','confirmed','chronic','2015-01-10','2015-01-10 10:00:00+02',
   'High-intensity statin therapy post-MI. LDL target < 1.8 mmol/L.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u6,'Aspirin','100 mg','once-daily','antiplatelets','active','Take after breakfast.',ARRAY['morning']::time_of_day[],99,'2023-02-14','2023-02-14 10:00:00+02'),
  (u6,'Atorvastatin','80 mg','once-daily','statins','active','Take at bedtime. High-intensity statin.',ARRAY['evening']::time_of_day[],97,'2022-02-14','2022-02-14 08:00:00+02'),
  (u6,'Ramipril','5 mg','once-daily','antihypertensives','active','Take in the morning.',ARRAY['morning']::time_of_day[],95,'2022-02-14','2022-02-14 08:00:00+02'),
  (u6,'Carvedilol','3.125 mg','twice-daily','antiarrhythmics','active','Take with food.',ARRAY['morning','evening']::time_of_day[],90,'2022-02-14','2022-02-14 08:00:00+02'),
  (u6,'Clopidogrel','75 mg','once-daily','antiplatelets','discontinued','Dual antiplatelet therapy – discontinued after 12 months post-PCI.',ARRAY['morning']::time_of_day[],98,'2022-02-14','2022-02-14 08:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p6,'2023-03-05','09:00','clinic',135,85,68,97,'2023-03-05 09:30:00+02'),
  (p6,'2023-06-14','09:30','clinic',132,82,66,97,'2023-06-14 09:45:00+02'),
  (p6,'2023-10-18','10:00','clinic',128,80,65,98,'2023-10-18 10:30:00+02'),
  (p6,'2024-02-06','09:00','clinic',126,78,64,98,'2024-02-06 09:30:00+02'),
  (p6,'2024-06-12','09:30','home', 124,77,63,98,'2024-06-12 09:45:00+02'),
  (p6,'2024-10-08','10:00','clinic',122,76,62,98,'2024-10-08 10:30:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p6,'LDL Cholesterol','1.9','mmol/L','< 1.8 (post-MI)','high','2024-06-13 10:00:00+02','Dr. Demo Doctor'),
  (p6,'Total Cholesterol','3.2','mmol/L','< 5.2','normal','2024-06-13 10:00:00+02','Dr. Demo Doctor'),
  (p6,'HDL Cholesterol','1.4','mmol/L','> 1.0','normal','2024-06-13 10:00:00+02','Dr. Demo Doctor'),
  (p6,'HbA1c','5.9','%','< 6.0','normal','2024-06-13 10:00:00+02','Dr. Demo Doctor'),
  (p6,'Creatinine','1.0','mg/dL','0.6–1.1','normal','2024-06-13 10:00:00+02','Dr. Demo Doctor'),
  (p6,'Haemoglobin','12.8','g/dL','12.0–16.0','normal','2024-06-13 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p6,doc_cardio,'post-procedure','Post-PCI 6-week review','Echo: EF 45%. No angina. Dual antiplatelet ongoing. Very good progress.','completed','2023-03-05 09:00:00+02','2023-03-05 09:45:00+02',45),
  (p6,doc_cardio,'follow-up','BP and lipid control 1-year post-MI','BP well controlled. LDL 2.1 – still above 1.8 target. Reinforce statin compliance.','completed','2023-06-14 09:30:00+02','2023-06-14 10:00:00+02',30),
  (p6,doc_cardio,'follow-up','Clopidogrel cessation at 12 months – proceed?','PCI at 12 months. No events. Stopped Clopidogrel. Continue Aspirin + Atorvastatin lifelong.','completed','2023-10-18 10:00:00+02','2023-10-18 10:40:00+02',40),
  (p6,doc_cardio,'follow-up','2-year post-MI review','LDL 1.9 – close to target. EF 45% stable. Patient adherent. Annual review planned.','completed','2024-02-06 09:00:00+02','2024-02-06 09:40:00+02',40);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P006A',p6,doc_cardio,'2026-08-12 09:00:00+02','follow-up','scheduled','Annual post-MI review and lipid check');


/* ================================================================
   P-007  Omar Suleiman  |  52 yo male  |  MODERATE RISK
   Hypertension Stage II + Hyperlipidemia
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Omar Suleiman','omar.suleiman@icare-demo.com','+20 115 667 3344','patient',pw)
RETURNING id INTO u7;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-007',u7,'1972-09-12','male','O-','6th October, Giza, Egypt',
  180.0,95.0,'married','Pharmacist',
  'never','rarely','1-2','high_fat','moderate','moderate')
RETURNING id INTO p7;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u7,'hypertension');

INSERT INTO family_history (user_id,has_family_history,relationship,condition) VALUES
  (u7,true,'Father','Hypertension and Stroke'),
  (u7,true,'Mother','Type 2 Diabetes');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p7,'I10','Hypertension Stage II','cardiac',true,'primary','moderate','confirmed','chronic','2021-05-20','2021-05-20 10:00:00+02',
   'Resting BP consistently > 155/95. Started Amlodipine. Weight loss advised.'),
  (p7,'E78.5','Hyperlipidemia','cardiac',true,'secondary','mild','confirmed','chronic','2021-05-20','2021-05-20 10:00:00+02',
   'LDL 3.8 at first visit. Started Atorvastatin 20 mg. Dietary fat restriction.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u7,'Amlodipine','5 mg','once-daily','antihypertensives','active','Take in the morning.',ARRAY['morning']::time_of_day[],91,'2021-05-20','2021-05-20 10:00:00+02'),
  (u7,'Atorvastatin','20 mg','once-daily','statins','active','Take at bedtime.',ARRAY['evening']::time_of_day[],86,'2021-05-20','2021-05-20 10:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p7,'2023-08-15','10:00','clinic',158,100,78,99,'2023-08-15 10:30:00+02'),
  (p7,'2024-01-20','09:30','clinic',153,96, 76,99,'2024-01-20 09:45:00+02'),
  (p7,'2024-05-22','10:00','home', 149,94, 74,99,'2024-05-22 10:15:00+02'),
  (p7,'2024-09-10','09:30','clinic',146,92, 73,99,'2024-09-10 09:45:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p7,'LDL Cholesterol','3.2','mmol/L','< 2.6','high','2024-01-21 10:00:00+02','Dr. Demo Doctor'),
  (p7,'Total Cholesterol','5.5','mmol/L','< 5.2','high','2024-01-21 10:00:00+02','Dr. Demo Doctor'),
  (p7,'HDL Cholesterol','1.2','mmol/L','> 1.0','normal','2024-01-21 10:00:00+02','Dr. Demo Doctor'),
  (p7,'Triglycerides','1.8','mmol/L','< 1.7','high','2024-01-21 10:00:00+02','Dr. Demo Doctor'),
  (p7,'Creatinine','0.9','mg/dL','0.7–1.3','normal','2024-01-21 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p7,doc_cardio,'new','Routine check – elevated BP noted by pharmacist colleague','BP 158/100 confirmed. Lipid panel high. Diagnosis: Hypertension II + Hyperlipidemia. Started Amlodipine + Atorvastatin.','completed','2023-08-15 10:00:00+02','2023-08-15 10:50:00+02',50),
  (p7,doc_cardio,'follow-up','BP still above target – compliance check','Good compliance. LDL coming down. Consider increasing Amlodipine to 10 mg.','completed','2024-01-20 09:30:00+02','2024-01-20 10:05:00+02',35);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P007A',p7,doc_cardio,'2026-07-28 10:00:00+02','follow-up','scheduled','BP review and lipid target assessment');


/* ================================================================
   P-008  Rania Fawzy  |  44 yo female  |  MODERATE RISK
   Hypertensive Cardiomyopathy (LVH) – early stage
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Rania Fawzy','rania.fawzy@icare-demo.com','+20 128 990 1122','patient',pw)
RETURNING id INTO u8;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-008',u8,'1980-02-14','female','A-','Zamalek, Cairo, Egypt',
  165.0,70.0,'married','Graphic Designer',
  'never','none','3-4','balanced','high','moderate')
RETURNING id INTO p8;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u8,'hypertension');

INSERT INTO family_history (user_id,has_family_history,relationship,condition) VALUES
  (u8,true,'Father','Hypertension from age 40'),
  (u8,true,'Grandfather (paternal)','Hypertensive heart disease');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p8,'I11.9','Hypertensive Cardiomyopathy with LV Hypertrophy','cardiac',true,'primary','moderate','confirmed','chronic','2022-07-05','2022-07-05 10:00:00+02',
   'Echo: concentric LVH, EF 62%, mild diastolic dysfunction Grade I. BP 150/96. Started ARB + beta-blocker. Annual echo monitoring.'),
  (p8,'I10','Hypertension','cardiac',true,'secondary','moderate','confirmed','chronic','2020-11-15','2020-11-15 09:00:00+02',
   'First detected in 2020. Initially managed with lifestyle only. Progressed to requiring medication.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u8,'Valsartan','160 mg','once-daily','antihypertensives','active','Take in the morning with or without food.',ARRAY['morning']::time_of_day[],93,'2022-07-05','2022-07-05 10:00:00+02'),
  (u8,'Nebivolol','5 mg','once-daily','antiarrhythmics','active','Take in the morning.',ARRAY['morning']::time_of_day[],91,'2022-07-05','2022-07-05 10:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p8,'2023-07-10','10:00','clinic',152,97,79,99,'2023-07-10 10:30:00+02'),
  (p8,'2023-11-28','09:30','clinic',148,94,77,99,'2023-11-28 09:45:00+02'),
  (p8,'2024-04-15','10:00','clinic',144,91,75,99,'2024-04-15 10:30:00+02'),
  (p8,'2024-09-03','09:00','home', 141,89,74,100,'2024-09-03 09:15:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p8,'Creatinine','0.8','mg/dL','0.6–1.1','normal','2024-04-16 10:00:00+02','Dr. Demo Doctor'),
  (p8,'Potassium','4.0','mEq/L','3.5–5.0','normal','2024-04-16 10:00:00+02','Dr. Demo Doctor'),
  (p8,'Total Cholesterol','4.8','mmol/L','< 5.2','normal','2024-04-16 10:00:00+02','Dr. Demo Doctor'),
  (p8,'HbA1c','5.6','%','< 6.0','normal','2024-04-16 10:00:00+02','Dr. Demo Doctor'),
  (p8,'TSH','2.1','mIU/L','0.4–4.0','normal','2024-04-16 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p8,doc_cardio,'new','Persistent headaches and found elevated BP at GP','BP 150/96. Echo ordered: LVH found. HCM diagnosed. Started Valsartan + Nebivolol. Lifestyle reinforced.','completed','2023-07-10 10:00:00+02','2023-07-10 10:55:00+02',55),
  (p8,doc_cardio,'follow-up','Echo follow-up after 6 months of treatment','BP improved to 144/91. Repeat echo: LVH stable, no progression. Good response.','completed','2023-11-28 09:30:00+02','2023-11-28 10:05:00+02',35);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P008A',p8,doc_cardio,'2026-07-10 10:30:00+02','follow-up','scheduled','Annual echo and BP review');


/* ================================================================
   P-009  Youssef Abdel-Aziz  |  67 yo male  |  LOW RISK
   Resolved Pericarditis (2023) + T2DM follow-up only
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Youssef Abdel-Aziz','youssef.abdelaziz@icare-demo.com','+20 109 443 8877','patient',pw)
RETURNING id INTO u9;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-009',u9,'1957-12-03','male','B-','Ain Shams, Cairo, Egypt',
  170.0,78.0,'divorced','Retired Teacher',
  'never','none','1-2','balanced','low','low')
RETURNING id INTO p9;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u9,'post-discharge');

INSERT INTO family_history (user_id,has_family_history,relationship,condition) VALUES
  (u9,true,'Mother','Type 2 Diabetes – late onset');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes,resolved_at) VALUES
  (p9,'I30.9','Acute Pericarditis (resolved)','cardiac',false,'primary','mild','confirmed','resolved','2023-04-18','2023-04-20 11:00:00+02',
   'Presented with sharp pleuritic chest pain and pericardial friction rub. Echo: small pericardial effusion. Treated with NSAIDs + Colchicine x 3 months. Fully resolved.', '2023-07-20 10:00:00+02');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p9,'E11','Type 2 Diabetes Mellitus','diabetes',true,'secondary','mild','confirmed','chronic','2016-09-01','2016-09-01 10:00:00+02',
   'HbA1c 6.9% at diagnosis. Well-controlled on Metformin 1000 mg BD. Annual HbA1c monitoring.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u9,'Metformin','1000 mg','twice-daily','diabetes_medications','active','Take with breakfast and dinner.',ARRAY['morning','evening']::time_of_day[],96,'2016-09-01','2016-09-01 10:00:00+02'),
  (u9,'Ibuprofen','400 mg','three-times-daily','other','discontinued','3-month course for pericarditis – completed.',ARRAY['morning','afternoon','evening']::time_of_day[],100,'2023-04-20','2023-04-20 11:00:00+02'),
  (u9,'Colchicine','0.5 mg','twice-daily','other','discontinued','Completed 3-month course for pericarditis.',ARRAY['morning','evening']::time_of_day[],100,'2023-04-20','2023-04-20 11:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p9,'2023-04-20','11:00','clinic',118,76,80,98,'2023-04-20 11:30:00+02'),
  (p9,'2023-07-20','10:00','clinic',120,78,72,99,'2023-07-20 10:30:00+02'),
  (p9,'2024-02-14','09:30','clinic',122,78,70,99,'2024-02-14 09:45:00+02'),
  (p9,'2024-08-22','10:00','home', 120,76,71,99,'2024-08-22 10:15:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p9,'HbA1c','6.7','%','< 7.0','normal','2024-02-15 10:00:00+02','Dr. Demo Doctor'),
  (p9,'Fasting Blood Glucose','6.8','mmol/L','3.9–5.6','high','2024-02-15 10:00:00+02','Dr. Demo Doctor'),
  (p9,'Creatinine','1.0','mg/dL','0.7–1.3','normal','2024-02-15 10:00:00+02','Dr. Demo Doctor'),
  (p9,'Total Cholesterol','4.2','mmol/L','< 5.2','normal','2024-02-15 10:00:00+02','Dr. Demo Doctor'),
  (p9,'CRP','0.4','mg/L','< 1.0','normal','2024-02-15 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p9,doc_cardio,'urgent','Sudden sharp chest pain worse on inspiration','Pericarditis confirmed: ECG saddle-shaped ST elevation, echo small effusion. Started NSAIDs + Colchicine.','completed','2023-04-20 11:00:00+02','2023-04-20 12:00:00+02',60),
  (p9,doc_cardio,'follow-up','Post-pericarditis 3-month check','Fully resolved. Echo clear. No effusion. Stopped NSAIDs and Colchicine. DM well controlled.','completed','2023-07-20 10:00:00+02','2023-07-20 10:40:00+02',40);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P009A',p9,doc_cardio,'2026-09-10 10:00:00+02','follow-up','scheduled','Annual DM follow-up and cardiac check');


/* ================================================================
   P-010  Nour El-Din Gamal  |  37 yo female  |  LOW RISK
   Benign palpitations – anxiety-related. Monitoring only.
   ================================================================ */
INSERT INTO "user" (is_active,name,email,phone,role,password)
VALUES (true,'Nour El-Din Gamal','nour.gamal@icare-demo.com','+20 101 778 5566','patient',pw)
RETURNING id INTO u10;

INSERT INTO patient (patient_number,user_id,date_of_birth,gender,blood_type,address,
  height_cm,weight_kg,marital_status,occupation,
  smoking_status,alcohol_consumption,exercise_frequency,dietary_habits,stress_level,risk_level)
VALUES ('P-010',u10,'1988-06-25','female','O+','New Cairo, Egypt',
  162.0,58.0,'single','Software Engineer',
  'never','rarely','3-4','balanced','high','low')
RETURNING id INTO p10;

INSERT INTO patient_history (user_id,chief_complaint) VALUES (u10,'palpitations');

INSERT INTO diagnosis (patient_id,icd_code,description,category,chronic_flag,type,severity,confirmation,status,onset_date,diagnosed_at,clinical_notes) VALUES
  (p10,'R00.2','Palpitations – benign, anxiety-associated','cardiac',false,'primary','mild','confirmed','active','2024-03-15','2024-03-20 10:00:00+02',
   'Holter: sinus rhythm throughout, occasional isolated PVCs < 1%. Echo: normal EF 65%, no structural abnormality. TSH normal. Likely anxiety-related. Low-dose Bisoprolol for symptom control.');

INSERT INTO medication (user_id,name,dose,frequency,type,status,instructions,time_of_day,adherence_percent,start_date,created_at) VALUES
  (u10,'Bisoprolol','2.5 mg','once-daily','antiarrhythmics','active','Take in the morning. Can reduce dose if HR < 55.',ARRAY['morning']::time_of_day[],84,'2024-03-20','2024-03-20 10:00:00+02');

INSERT INTO vital_reading (patient_id,date,time,source,systolic_bp,diastolic_bp,heart_rate,oxygen_saturation,created_at) VALUES
  (p10,'2024-03-20','10:00','clinic',118,76,88,99,'2024-03-20 10:30:00+02'),
  (p10,'2024-06-12','09:30','clinic',116,74,82,100,'2024-06-12 09:45:00+02'),
  (p10,'2024-10-08','10:00','home', 115,73,79,100,'2024-10-08 10:15:00+02');

INSERT INTO lab_result (patient_id,test_name,value,unit,reference_range,status,result_at,ordered_by) VALUES
  (p10,'TSH','1.8','mIU/L','0.4–4.0','normal','2024-03-21 10:00:00+02','Dr. Demo Doctor'),
  (p10,'Haemoglobin','13.2','g/dL','12.0–16.0','normal','2024-03-21 10:00:00+02','Dr. Demo Doctor'),
  (p10,'Total Cholesterol','4.1','mmol/L','< 5.2','normal','2024-03-21 10:00:00+02','Dr. Demo Doctor'),
  (p10,'Magnesium','0.9','mmol/L','0.75–1.0','normal','2024-03-21 10:00:00+02','Dr. Demo Doctor');

INSERT INTO consultation (patient_id,doctor_id,visit_type,chief_complaint,notes,status,started_at,completed_at,duration_minutes) VALUES
  (p10,doc_cardio,'new','Frequent palpitations for 6 weeks – worsens with stress','Holter 24h: sinus rhythm, isolated PVCs < 1%. Echo normal. TSH normal. Benign. Low-dose Bisoprolol + stress management.','completed','2024-03-20 10:00:00+02','2024-03-20 10:50:00+02',50);

INSERT INTO appointment (confirmation_code,patient_id,doctor_id,scheduled_at,visit_type,status,reason) VALUES
  ('APC-P010A',p10,doc_cardio,'2026-08-20 11:00:00+02','follow-up','scheduled','6-month palpitation reassessment');

END $$;
