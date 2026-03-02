-- 00005_advanced_features.sql
-- Adds: qr_code_versions table, advanced QR columns (scheduled redirects,
--        expiry page config, routing rules, version count).

-- ---------------------------------------------------------------------------
-- 1. New columns on qr_codes
-- ---------------------------------------------------------------------------

ALTER TABLE public.qr_codes
  ADD COLUMN IF NOT EXISTS scheduled_redirects jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expiry_page_config jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS routing_rules jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS version_count int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.qr_codes.scheduled_redirects IS 'JSON schedule rules for time/day-based redirect destinations';
COMMENT ON COLUMN public.qr_codes.expiry_page_config IS 'Branded expiry page shown when a QR code is expired or inactive';
COMMENT ON COLUMN public.qr_codes.routing_rules IS 'Device/language/country routing rules for smart redirects';
COMMENT ON COLUMN public.qr_codes.version_count IS 'Denormalised counter — total number of tracked versions';

-- ---------------------------------------------------------------------------
-- 2. qr_code_versions table (version history for QR codes)
-- ---------------------------------------------------------------------------

CREATE TABLE public.qr_code_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES public.qr_codes (id) ON DELETE CASCADE,
  version_number int NOT NULL,
  destination_url text,
  static_data jsonb,
  style jsonb,
  changed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  change_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_versions_qr ON public.qr_code_versions (qr_code_id, version_number DESC);

-- ---------------------------------------------------------------------------
-- 3. Row-Level Security for qr_code_versions
-- ---------------------------------------------------------------------------

ALTER TABLE public.qr_code_versions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read versions belonging to their own QR codes
CREATE POLICY "Users can read versions of their QR codes"
  ON public.qr_code_versions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.qr_codes
      WHERE qr_codes.id = qr_code_versions.qr_code_id
        AND qr_codes.user_id = auth.uid()
    )
  );

-- Authenticated users can insert versions for their own QR codes
CREATE POLICY "Users can insert versions for their QR codes"
  ON public.qr_code_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.qr_codes
      WHERE qr_codes.id = qr_code_versions.qr_code_id
        AND qr_codes.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. RPC function to atomically increment version_count
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_version_count(row_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.qr_codes
  SET version_count = version_count + 1
  WHERE id = row_id;
$$;
