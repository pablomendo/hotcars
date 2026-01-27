import type { Metadata } from "next";
import { Bebas_Neue, Inter_Tight } from "next/font/google"; 
import "./globals.css";
import Header from "@/components/ui/Header";

// Bebas Neue (Para otros usos)
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

// "Google Sans" (vía Inter Tight) - Peso 700 para los títulos
const googleSans = Inter_Tight({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-google",
});

export const metadata: Metadata = {
  title: "HotCars | Plataforma Profesional",
  description: "Compra, venta y consignación de vehículos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${googleSans.variable}`}>
      {/* Seteamos el fondo gris clarito en el body para que sea infinito */}
      <body className="antialiased font-sans bg-[#f0f2f5] text-text-main">
        <div className="min-h-screen flex flex-col">
          <Header />
          {/* QUITAMOS: 'container', 'mx-auto', 'px-6' y 'py-8'.
              AHORA: El contenido fluye libre hasta los bordes del monitor.
          */}
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}