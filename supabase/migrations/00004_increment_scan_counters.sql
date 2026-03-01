-- QR DNA: Atomic scan counter increment function
-- Avoids race conditions from read-modify-write under concurrent scans

create or replace function increment_scan_counters(
  qr_id uuid,
  is_unique_scan boolean default false
)
returns void
language plpgsql
security definer
as $$
begin
  if is_unique_scan then
    update qr_codes
    set total_scans = total_scans + 1,
        unique_scans = unique_scans + 1,
        last_scan_at = now()
    where id = qr_id;
  else
    update qr_codes
    set total_scans = total_scans + 1,
        last_scan_at = now()
    where id = qr_id;
  end if;
end;
$$;
