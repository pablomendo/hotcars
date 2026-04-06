// app/(subdomain)/agencia/[slug]/layout.tsx
//
// El paréntesis en (subdomain) es un Route Group de Next.js App Router.
// IMPORTANTE: Estos grupos SÍ heredan el layout raíz, por eso eliminamos 
// las etiquetas duplicadas para frenar el error de hidratación.

export default function SubdomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mantenemos el estilo exactamente como lo tenías, pero en un contenedor válido */}
      <div style={{ margin: 0, padding: 0, overflowX: 'hidden', minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}