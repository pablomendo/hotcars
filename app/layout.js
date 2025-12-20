import React from 'react';

/**
 * CONFIGURACIÓN GLOBAL DE HOTCARS
 */

export const metadata = {
  title: 'HotCars',
  description: 'el Marketplace de los mejores autos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {/* Forzamos el título aquí también para asegurar que Vercel lo detecte al instante */}
        <title>HotCars</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0,
        backgroundColor: '#020617', 
        color: 'white',
        minHeight: '100vh',
        fontFamily: 'sans-serif'
      }}>
        {children}
      </body>
    </html>
  );
}
