import type { Metadata } from "next";
import { Bebas_Neue, Inter_Tight } from "next/font/google"; 
import "./globals.css";
import HeaderWrapper from "@/components/ui/HeaderWrapper";
import { headers } from "next/headers";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const googleSans = Inter_Tight({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-google",
});

export const metadata: Metadata = {
  title: "HotCars | Venta y Gestion Automotor",
  description: "El marketplace de autos usados más profesional de Argentina. Red privada de vendedores, grupos de trabajo, flips compartidos de vehículos con otros vendedores o agencias, gestión de stock y tu propia agencia online.",
};

// Agregamos el async aquí
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ahora sí, esperamos los headers correctamente
  const headersList = await headers();
  const host = headersList.get('host') || "";

  const isSubdomain = host.includes('.hotcars.com.ar') || 
                      (host.includes('.localhost') && host !== 'localhost:3000');

  return (
    <html lang="es" className={`${bebasNeue.variable} ${googleSans.variable}`}>
      <body className="antialiased font-sans bg-[#f0f2f5] text-text-main">
        <div className="min-h-screen flex flex-col">
          {!isSubdomain && <HeaderWrapper />}
          <main className="flex-1 w-full pb-20 lg:pb-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}