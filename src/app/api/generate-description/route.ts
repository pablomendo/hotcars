import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, model, year, km, highlights, version, category } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    const url = "https://api.openai.com/v1/chat/completions";

    const prompt = `Escribe una descripción para publicar un auto usado en Marketplace o portales de venta.

El texto debe sonar completamente humano, como si lo hubiera escrito el dueño del auto desde el celular. Debe ser simple, directo y natural.

Reglas de estilo obligatorias:

- No usar lenguaje de vendedor ni frases de catálogo.
- No usar expresiones como: "excelente oportunidad", "vehículo confiable", "imperdible", "digno de ver", "unidad destacada".
- No exagerar ni intentar convencer.
- No inventar información que no esté en los datos.
- Debe leerse como un aviso real de dueño.

Tono del texto:

- directo
- honesto
- simple
- natural

Estructura:

1. Primera línea: Marca, modelo y versión del auto.
2. Segunda línea: Kilometraje real y, si se sabe, tipo de uso (ruta o ciudad).
3. Un párrafo corto contando cómo anda el auto o cómo está de mecánica.
4. Si el vehículo tiene algún detalle cargado en los datos, mencionarlo de forma natural y breve.
5. Lista simple de datos usando ✔:
   ✔ Año  
   ✔ Kilometraje  
   ✔ Motor o versión  
   ✔ Estado general  
   ✔ Un punto positivo simple (ejemplo: interior sano, listo para transferir, buen andar).

6. Cerrar con una frase corta invitando a escribir.

Reglas adicionales:

- Máximo 90 a 120 palabras.
- Frases cortas.
- Lenguaje cotidiano argentino.
- No usar emojis.
- Debe poder leerse rápido desde un celular.

Datos del vehículo:

Marca: ${brand}  
Modelo: ${model}  
Versión: ${version || ""}  
Año: ${year}  
Kilómetros: ${km}  
Motor: ${version || ""}  
Estado: ${category || ""}  
Información adicional: ${highlights?.join(", ") || ""}  
Detalle o defecto (si existe): No especificado`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", 
        messages: [
          { role: "system", content: "Eres un redactor experto en autos." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const aiText = data.choices[0].message.content;
    
    return NextResponse.json({ text: aiText });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Error de conexión", 
      details: error.message 
    }, { status: 500 });
  }
}