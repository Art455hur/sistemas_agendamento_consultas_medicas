const uncertain = {
  type: "info",
  complete: false,
  message: "Não conseguimos confirmar o resultado do cadastro. Se recebeu o e-mail de confirmação, abra o link e depois faça login. Caso contrário, tente novamente mais tarde.",
};

export function registrationFeedback({ data, error } = {}) {
  if (error) {
    if (error.status === 429 || ["over_email_send_rate_limit", "over_request_rate_limit"].includes(error.code)) {
      return { type: "info", complete: false, message: "Aguarde antes de tentar novamente. Se o e-mail de confirmação já chegou, abra o link e depois faça login." };
    }
    if (["user_already_exists", "email_exists"].includes(error.code)) {
      return { type: "info", complete: false, message: "Já existe um cadastro com este e-mail. Confirme o e-mail, se necessário, e faça login. Se esqueceu a senha, use a opção de recuperação." };
    }
    if (error.status >= 500) return uncertain;
    if (error.code === "weak_password") {
      return { type: "error", complete: false, message: "Escolha uma senha mais forte e tente novamente." };
    }
    return { type: "error", complete: false, message: "Não foi possível enviar o cadastro. Confira os dados e tente novamente." };
  }
  if (!data?.user) return uncertain;
  return {
    type: "success",
    complete: true,
    message: data.session
      ? "Conta criada com sucesso! Você já pode acessar sua conta."
      : "Cadastro enviado com sucesso! Confira seu e-mail, inclusive a pasta de spam, e abra o link de confirmação. Depois, faça login.",
  };
}

export function registrationConnectionFeedback() {
  return uncertain;
}
