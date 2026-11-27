import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/patient-theme.css";
import "../styles/staff-theme.css";
import AuthGuard from "@/features/auth/components/AuthGuard.js";

// Fonte do tema da área do paciente; disponível como var(--font-inter).
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata = {
  title: "Sistema de Agendamento Médico",
  description:
    "Sistema de agendamento de consultas médicas",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
