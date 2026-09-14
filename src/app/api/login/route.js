
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "../../../lib/db.js";
import { criarSessao } from "../../../lib/session.js";

export async function POST(request) {
  let dados;

  try {
    dados = await request.json();
  } catch {
    return NextResponse.json(
      { erro: "Dados inválidos." },
      { status: 400 }
    );
  }

  const { email, senha } = dados ?? {};

  if (
    typeof email !== "string" ||
    typeof senha !== "string" ||
    !email.trim() ||
    email.trim().length > 254 ||
    !senha ||
    bcrypt.truncates(senha)
  ) {
    return NextResponse.json(
      { erro: "Informe um e-mail e uma senha válidos." },
      { status: 400 }
    );
  }

  try {
    const [usuarios] = await db.execute(
      "SELECT email, senha FROM usuarios WHERE email = ? LIMIT 1",
      [email.trim()]
    );

    const usuario = usuarios[0];

    const senhaCorreta =
      usuario &&
      typeof usuario.senha === "string" &&
      (await bcrypt.compare(senha, usuario.senha));

    if (!senhaCorreta) {
      return NextResponse.json(
        { erro: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    await criarSessao(usuario.email);

    return NextResponse.json(
      { mensagem: "Login realizado com sucesso!" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível realizar o login." },
      { status: 500 }
    );
  }
}