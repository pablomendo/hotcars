// app/(subdomain)/agencia/[slug]/layout.tsx
//
// CRÍTICO: Para suprimir el HeaderWrapper del app/layout.tsx raíz,
// este route group DEBE tener su propio <html> y <body>.
// Next.js App Router permite layouts anidados con html+body
// dentro de route groups — esto rompe la herencia del layout raíz.

export default function SubdomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body 
        style={{ margin: 0, padding: 0, overflowX: 'hidden' }} 
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}