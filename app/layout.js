export const metadata = {
  title: 'HotCars',
  description: 'Red de Stock Profesional',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <title>HotCars</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ margin: 0, backgroundColor: '#020617', color: 'white' }}>
        {children}
      </body>
    </html>
  );
}
