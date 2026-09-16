import "./globals.css";
import AuthGuard from "../components/AuthGuard";

export const metadata = {
  title: "Sistema de Agendamento Médico",
  description:
    "Sistema de agendamento de consultas médicas",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}