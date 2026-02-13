"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Rutas donde NO queremos que aparezca el Header global con menús
  const authRoutes = ["/login", "/register", "/reset-password"];
  
  // Si estamos en una de esas rutas, no renderizamos nada (permitiendo que la page use su propio header)
  if (authRoutes.includes(pathname)) {
    return null;
  }

  return <Header />;
}