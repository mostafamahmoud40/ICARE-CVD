CREATE TABLE vital_reading (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL
        REFERENCES patient(id)
        ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(5) NOT NULL DEFAULT TO_CHAR(CURRENT_TIME, 'HH24:MI'),
    source VARCHAR(10) NOT NULL DEFAULT 'home'
        CHECK (source IN ('home', 'clinic', 'hospital')),
    systolic_bp SMALLINT,
    diastolic_bp SMALLINT,
    heart_rate SMALLINT,
    oxygen_saturation SMALLINT,
    temperature DECIMAL(4,1),
    weight DECIMAL(5,1),
    blood_sugar SMALLINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bp_consistency CHECK (
        (systolic_bp IS NULL AND diastolic_bp IS NULL)
        OR
        (systolic_bp IS NOT NULL AND diastolic_bp IS NOT NULL)
    ),
    CONSTRAINT valid_ranges CHECK (
        (heart_rate IS NULL OR heart_rate BETWEEN 30 AND 220) AND
        (oxygen_saturation IS NULL OR oxygen_saturation BETWEEN 70 AND 100) AND
        (temperature IS NULL OR temperature BETWEEN 30 AND 45) AND
        (blood_sugar IS NULL OR blood_sugar BETWEEN 40 AND 500)
    )
);

CREATE INDEX idx_vital_reading_patient_date ON vital_reading (patient_id, date DESC);
