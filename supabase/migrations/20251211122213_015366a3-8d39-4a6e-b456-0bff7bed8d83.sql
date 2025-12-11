-- Create blood pressure records table
CREATE TABLE public.blood_pressure_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    record_date DATE NOT NULL,
    record_time TIME NOT NULL,
    systolic INTEGER NOT NULL, -- 上壓
    diastolic INTEGER NOT NULL, -- 下壓
    pulse INTEGER NOT NULL, -- 脈搏
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blood_pressure_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own records (matching email)
CREATE POLICY "Users can view own records"
ON public.blood_pressure_records
FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- Policy: Users can insert their own records
CREATE POLICY "Users can insert own records"
ON public.blood_pressure_records
FOR INSERT
TO authenticated
WITH CHECK (email = auth.jwt() ->> 'email');

-- Policy: Users can update their own records
CREATE POLICY "Users can update own records"
ON public.blood_pressure_records
FOR UPDATE
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- Policy: Users can delete their own records
CREATE POLICY "Users can delete own records"
ON public.blood_pressure_records
FOR DELETE
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blood_pressure_records_updated_at
BEFORE UPDATE ON public.blood_pressure_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();