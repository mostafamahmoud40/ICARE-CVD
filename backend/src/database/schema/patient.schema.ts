import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './users.schema';

export const patientGenderEnum = pgEnum('patient_gender', [
  'male',
  'female',
  'other',
]);

export const patientBloodTypeEnum = pgEnum('patient_blood_type', [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]);

export const patientMaritalStatusEnum = pgEnum('patient_marital_status', [
  'single',
  'married',
  'divorced',
  'widowed',
]);

export const patientSmokingStatusEnum = pgEnum('patient_smoking_status', [
  'never',
  'former-5',
  'former-10',
  'former-15',
  'former-20',
  'current-5',
  'current-10',
  'current-15',
  'current-20',
]);

export const patientAlcoholConsumptionEnum = pgEnum(
  'patient_alcohol_consumption',
  ['none', 'rarely', 'weekly', 'daily'],
);

export const patientRecreationalDrugUseEnum = pgEnum(
  'patient_recreational_drug_use',
  ['no', 'sometimes', 'yes'],
);

export const patientExerciseFrequencyEnum = pgEnum(
  'patient_exercise_frequency',
  ['none', '1-2', '3-4', '5+'],
);

export const patientExerciseDurationEnum = pgEnum('patient_exercise_duration', [
  'under-30',
  '30-60',
  'over-60',
]);

export const patientExerciseTypeEnum = pgEnum('patient_exercise_type', [
  'walking',
  'gym',
  'swimming',
  'cycling',
  'other',
]);

export const patientPhysicalActivityLevelEnum = pgEnum(
  'patient_physical_activity_level',
  ['low', 'moderate', 'high'],
);

export const patientDietaryHabitsEnum = pgEnum('patient_dietary_habits', [
  'balanced',
  'high_salt',
  'high_fat',
  'high_both',
  'other',
]);

export const patientStressLevelEnum = pgEnum('patient_stress_level', [
  'low',
  'moderate',
  'high',
]);

/** One profile per `user` with role patient; `user_id` matches `user.id` (serial). */
export const patient = pgTable('patient', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: integer('user_id')
    .references(() => user.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  dateOfBirth: date('date_of_birth', { mode: 'date' }).notNull(),
  nationalId: varchar('national_id', { length: 50 }),
  gender: patientGenderEnum('gender').notNull(),
  bloodType: patientBloodTypeEnum('blood_type'),
  address: text('address'),
  heightCm: decimal('height_cm', { precision: 5, scale: 1, mode: 'number' }),
  weightKg: decimal('weight_kg', { precision: 5, scale: 1, mode: 'number' }),
  bmi: decimal('bmi', {
    precision: 4,
    scale: 1,
    mode: 'number',
  }).generatedAlwaysAs(
    () =>
      sql`CASE
        WHEN ${sql.identifier('height_cm')} IS NOT NULL
         AND ${sql.identifier('weight_kg')} IS NOT NULL
         AND ${sql.identifier('height_cm')} > 0::numeric
        THEN ROUND(
          (${sql.identifier('weight_kg')}::numeric
            / POWER(${sql.identifier('height_cm')}::numeric / 100.0, 2))::numeric,
          1
        )
        ELSE NULL
      END`,
  ),
  maritalStatus: patientMaritalStatusEnum('marital_status'),
  occupation: varchar('occupation', { length: 100 }),
  smokingStatus: patientSmokingStatusEnum('smoking_status'),
  alcoholConsumption: patientAlcoholConsumptionEnum('alcohol_consumption'),
  caffeineIntake: smallint('caffeine_intake').notNull().default(0),
  recreationalDrugUse: patientRecreationalDrugUseEnum('recreational_drug_use'),
  exerciseFrequency: patientExerciseFrequencyEnum('exercise_frequency'),
  exerciseDuration: patientExerciseDurationEnum('exercise_duration'),
  exerciseType: patientExerciseTypeEnum('exercise_type'),
  physicalActivityLevel: patientPhysicalActivityLevelEnum(
    'physical_activity_level',
  ),
  dietaryHabits: patientDietaryHabitsEnum('dietary_habits'),
  highSaltDiet: boolean('high_salt_diet')
    .notNull()
    .generatedAlwaysAs(
      () =>
        sql`(${sql.identifier('dietary_habits')} IS NOT NULL AND ${sql.identifier('dietary_habits')} IN ('high_salt'::patient_dietary_habits, 'high_both'::patient_dietary_habits))`,
    ),
  highFatDiet: boolean('high_fat_diet')
    .notNull()
    .generatedAlwaysAs(
      () =>
        sql`(${sql.identifier('dietary_habits')} IS NOT NULL AND ${sql.identifier('dietary_habits')} IN ('high_fat'::patient_dietary_habits, 'high_both'::patient_dietary_habits))`,
    ),
  stressLevel: patientStressLevelEnum('stress_level'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
