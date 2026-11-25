import { createClient } from "@/lib/supabase/server";
import { validAppointmentId } from "../../fields";

export const dynamic = "force-dynamic";
export async function GET(_request, { params }) {
  const { id, file } = await params;
  const headers = {"Cache-Control":"private, no-store", "X-Content-Type-Options":"nosniff"};
  const missing = () => new Response(null, {status:404, headers});
  if (!validAppointmentId(id) || !validAppointmentId(file)) return missing();
  const db = await createClient();
  const { data, error } = await db.from("doctor_exam_files").select("mime,content")
    .eq("appointment_id",id).eq("id",file).maybeSingle();
  if (error || !data || !data.content?.startsWith("\\x")) return missing();
  const ext = {"application/pdf":"pdf","image/png":"png","image/jpeg":"jpg"}[data.mime];
  if (!ext) return missing();
  return new Response(Buffer.from(data.content.slice(2),"hex"), {headers:{...headers,
    "Content-Type":data.mime, "Content-Disposition":`attachment; filename="exame.${ext}"`,
    "Content-Security-Policy":"sandbox; default-src 'none'",
  }});
}
