import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, model, year, km, highlights, version, category } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    const url = "https://api.openai.com/v1/chat/completions";

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

    // Si OpenAI devuelve un error (por saldo, modelo, etc.), lo capturamos aquí
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