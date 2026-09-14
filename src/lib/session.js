
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function obterChave() {
  const segredo = process.env.SESSION_SECRET;

  if (!segredo || segredo.length < 64) {
    throw new Error("Configure SESSION_SECRET no arquivo .env.local.");
  }

  return new TextEncoder().encode(segredo);
}

export async function criarSessao(email) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime("2h")
    .setIssuer("consultorio")
    .setAudience("consultorio")
    .sign(obterChave());

  const cookieStore = await cookies();

  cookieStore.set("sessao", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60,
  });
}

export async function obterSessao() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sessao")?.value;

  if (!token) {
    return null;
  }

  const chave = obterChave();

  try {
    const { payload } = await jwtVerify(token, chave, {
      algorithms: ["HS256"],
      issuer: "consultorio",
      audience: "consultorio",
    });

    if (typeof payload.sub !== "string" || !payload.sub) {
      return null;
    }

    return { email: payload.sub };
  } catch {
    return null;
  }
}

export async function encerrarSessao() {
  const cookieStore = await cookies();
  cookieStore.delete("sessao");
}