"use client";

import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

const protectedRoutes = [
  "/dashboard",
  "/agendar",
  "/agendamentos",
  "/perfil",
  "/confirmacao",
];

const guestOnlyRoutes = [
  "/login",
  "/cadastro",
];

export default function AuthGuard({
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [allowedPath, setAllowedPath] =
    useState(null);

  const isProtectedRoute =
    protectedRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`)
    );

  const isGuestOnlyRoute =
    guestOnlyRoutes.includes(pathname);

  useEffect(() => {
    if (
      !isProtectedRoute &&
      !isGuestOnlyRoute
    ) {
      return;
    }

    setAllowedPath(null);

    const token =
      localStorage.getItem("authToken") ||
      sessionStorage.getItem("authToken");

    if (isProtectedRoute && !token) {
      const currentPage =
        window.location.pathname +
        window.location.search;

      router.replace(
        `/login?redirect=${encodeURIComponent(
          currentPage
        )}`
      );

      return;
    }

    if (isGuestOnlyRoute && token) {
      const parameters =
        new URLSearchParams(
          window.location.search
        );

      const redirect =
        parameters.get("redirect");

      const isSafeRedirect =
        redirect &&
        redirect.startsWith("/") &&
        !redirect.startsWith("//");

      if (isSafeRedirect) {
        router.replace(redirect);
        return;
      }

      const specialty =
        parameters.get("especialidade");

      const doctor =
        parameters.get("profissional");

      if (specialty) {
        const bookingParameters =
          new URLSearchParams();

        bookingParameters.set(
          "especialidade",
          specialty
        );

        if (doctor) {
          bookingParameters.set(
            "profissional",
            doctor
          );
        }

        router.replace(
          `/agendar?${bookingParameters.toString()}`
        );

        return;
      }

      router.replace("/dashboard");
      return;
    }

    setAllowedPath(pathname);
  }, [
    isGuestOnlyRoute,
    isProtectedRoute,
    pathname,
    router,
  ]);

  if (
    !isProtectedRoute &&
    !isGuestOnlyRoute
  ) {
    return children;
  }

  if (allowedPath !== pathname) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />

        <p>Verificando sua sessão...</p>
      </div>
    );
  }

  return children;
}