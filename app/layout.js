export const metadata = {
  title: 'AutoHub - Panel de Revendedor',
  description: 'Gestión profesional de marketplace de autos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Cargamos Tailwind CSS para que los estilos funcionen */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="antialiased bg-slate-50 text-slate-900" suppressHydrationWarning>
        {/* Aquí es donde se mostrará el contenido de tu archivo page.js */}
        {children}
      </body>
    </html>
  )
}