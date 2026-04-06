"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/header/Header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  const hiddenRoutes = [
    "/login",
    "/register",
    "/reset-password",
  ];

  // Ocultar en rutas de agencia (subdominios reescritos por el middleware)
  if (pathname.startsWith("/agencia/")) return null;

  if (hiddenRoutes.includes(pathname)) return null;

  return <Header />;
}