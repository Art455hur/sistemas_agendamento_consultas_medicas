import { isValidCpf } from "../../../shared/validation/cpf.js";
import { patientNameError } from "../../../shared/validation/patient-name.js";

const fields = "full_name,phone,birth_date,cpf";

async function currentUser(client) {
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error("Sua sessão expirou. Entre novamente.");
  return data.user;
}

function fromRow(row, user) {
  return {
    name: row.full_name || "", email: user.email || "",
    phone: row.phone || "", birthDate: row.birth_date || "", cpf: row.cpf || "",
  };
}

export async function loadPatientProfile(client) {
  const user = await currentUser(client);
  const { data, error } = await client.from("profiles").select(fields).eq("id", user.id).single();
  if (error || !data) throw new Error("Não foi possível carregar o perfil.");
  return fromRow(data, user);
}

export async function savePatientProfile(client, profile) {
  const nameError = patientNameError(profile.name);
  if (nameError) throw new Error(nameError);
  const name = profile.name.trim();
  const phone = profile.phone.replace(/\D/g, "");
  const cpf = profile.cpf.replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 11) throw new Error("Digite um telefone válido.");
  if (!isValidCpf(profile.cpf)) throw new Error("Digite um CPF válido.");
  const today = new Date();
  const maximum = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const birthDate = profile.birthDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(Date.parse(birthDate)) || new Date(birthDate).toISOString().slice(0, 10) !== birthDate || birthDate > maximum) {
    throw new Error("Informe uma data de nascimento válida, até hoje.");
  }
  const user = await currentUser(client);
  const { data, error } = await client.from("profiles").update({
    full_name: name, phone, cpf, birth_date: birthDate,
  }).eq("id", user.id).select(fields).single();
  if (error || !data) {
    if (error?.code === "23505") throw new Error("Este CPF já está cadastrado em outra conta.");
    throw new Error("Não foi possível salvar o perfil. Tente novamente.");
  }
  return fromRow(data, user);
}
