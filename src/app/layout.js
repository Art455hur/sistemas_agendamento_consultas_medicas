import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Sistema de Agendamento Médico",
  description: "Sistema de agendamento de consultas médicas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}