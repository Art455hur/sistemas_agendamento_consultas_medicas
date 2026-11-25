"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseClinicalFields, validAppointmentId } from "./fields";

export async function saveClinicalNote(id, revision, _state, formData) {
  const fields = parseClinicalFields(formData);
  if (!validAppointmentId(id) || !Number.isInteger(revision) || revision < 0 || !fields) {
    return { message: "Preencha as Anotações do atendimento e confira os limites dos campos." };
  }
  if (process.env.NEXT_PUBLIC_ENABLE_SUPABASE_AUTH !== "true" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { message: "O registro está indisponível." };
  }
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError || !data?.claims?.sub) return { message: "Sua sessão expirou. Entre novamente em outra aba e tente salvar." };

  const { error } = await supabase.rpc("doctor_save_clinical_note", {
    p_id: id, p_revision: revision, p_evolution: fields.evolution,
    p_diagnosis: fields.diagnosis, p_plan: fields.plan,
  });
  if (error?.code === "40001") return { message: "Outra versão foi salva. Confira o registro atualizado em outra aba antes de editar novamente." };
  if (error?.code === "42501" || error?.code === "P0002") return { message: "Você não pode registrar este atendimento." };
  if (error) return { message: "Não foi possível salvar o registro. Tente novamente." };
  redirect(`/medico/atendimento/${id}?salvo=1`);
}
