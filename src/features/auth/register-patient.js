// O formulário valida os dados antes de chamar o serviço. O banco mantém suas
// próprias restrições; permissões nunca são derivadas destes metadados.
export function registerPatient(client, form, emailRedirectTo) {
  return client.auth.signUp({
    email: form.email.trim().toLowerCase(),
    password: form.password,
    options: {
      data: {
        name: form.name.trim(),
        phone: form.phone.replace(/\D/g, ""),
        cpf: form.cpf.replace(/\D/g, ""),
        birth_date: form.birthDate,
      },
      emailRedirectTo,
    },
  });
}
