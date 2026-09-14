
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "../../../lib/db.js";

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

  const { nome, email, senha, confirmarSenha, funcao } = dados ?? {};

  if (
    typeof nome !== "string" ||
    typeof email !== "string" ||
    typeof senha !== "string" ||
    typeof confirmarSenha !== "string" ||
    !nome.trim() ||
    !email.trim() ||
    !senha ||
    nome.trim().length > 150 ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !["Paciente", "Médico"].includes(funcao)
  ) {
    return NextResponse.json(
      { erro: "Preencha todos os campos corretamente." },
      { status: 400 }
    );
  }

  if (senha !== confirmarSenha) {
    return NextResponse.json(
      { erro: "As senhas não coincidem." },
      { status: 400 }
    );
  }

  if (bcrypt.truncates(senha)) {
    return NextResponse.json(
      { erro: "A senha é muito longa. Use uma senha menor." },
      { status: 400 }
    );
  }

  try {
    const senhaHash = await bcrypt.hash(senha, 12);

    await db.execute(
      "INSERT INTO usuarios (nome, email, senha, funcao) VALUES (?, ?, ?, ?)",
      [nome.trim(), email.trim(), senhaHash, funcao]
    );

    return NextResponse.json(
      { mensagem: "Cadastro realizado com sucesso!" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { erro: "Não foi possível realizar o cadastro." },
      { status: 500 }
    );
  }
}