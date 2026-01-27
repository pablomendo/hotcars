import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, model, year, km, highlights, version, category } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Verificación de la API Key en el servidor
    if (!apiKey) {
      console.error("DEBUG IA: No se encontró la GEMINI_API_KEY en .env.local");
      return NextResponse.json({ error: "Falta configurar la API Key en el servidor" }, { status: 500 });
    }

    // Usamos la URL v1 estable con gemini-pro (el modelo más compatible)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `Actúa como un experto en marketing automotriz y redactor SEO para HotCars.
    
Vehículo: ${brand} ${model} ${version || ""} ${year}
Kilometraje: ${km} km
Categoría: ${category || "Auto"}
Puntos destacados: ${highlights?.join(", ") || "Excelente estado"}.

Instrucciones:
1. Escribe una descripción vendedora de máximo 120 palabras.
2. Incluye la frase '${brand} ${model} ${year}' de forma natural al principio para SEO.
3. Resalta el estado y la oportunidad de compra.
4. Termina con un llamado a la acción profesional.
5. No uses emojis excesivos ni lenguaje informal.`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    const data = await response.json();

    // Si Google nos rebota por permisos o cuota
    if (data.error) {
      console.error("GOOGLE API ERROR:", data.error.message);
      return NextResponse.json({ 
        error: "Google rechazó la petición", 
        details: data.error.message 
      }, { status: 500 });
    }

    // Verificamos que haya generado texto
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json({ error: "La IA no pudo generar el texto." }, { status: 500 });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({ text: aiText });

  } catch (error: any) {
    console.error("DEBUG IA CRASH:", error.message);
    return NextResponse.json({ 
      error: "Error de conexión", 
      details: error.message 
    }, { status: 500 });
  }
}