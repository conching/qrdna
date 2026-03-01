import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QRDetailView } from "./qr-detail-view";

export default async function QRDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: qrCode } = await supabase
    .from("qr_codes")
    .select("*")
    .eq("id", id)
    .single();

  if (!qrCode) notFound();

  return <QRDetailView initialData={qrCode} />;
}
