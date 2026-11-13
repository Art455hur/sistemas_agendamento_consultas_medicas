export const demoPatient = Object.freeze({
  name: "Paciente de Teste",
  email: "paciente.e2e@example.test",
  phone: "11988887777",
  birthDate: "1995-04-18",
  cpf: "17483920505",
  password: "senha-ficticia-123",
});

export async function fillRegistrationForm(page, overrides = {}) {
  const patient = { ...demoPatient, ...overrides };

  await page.getByLabel("Nome completo").fill(patient.name);
  await page.getByLabel("E-mail").fill(patient.email);
  await page.getByLabel("Telefone").fill(patient.phone);
  await page.getByLabel("Data de nascimento").fill(patient.birthDate);
  await page.getByLabel("CPF").fill(patient.cpf);
  await page.locator("#password").fill(patient.password);
  await page.locator("#confirmPassword").fill(patient.password);

  return patient;
}
