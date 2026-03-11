import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, model, year, km, highlights, version, category } = body;

    const apiKey = process.env.OPENAI_API_KEY;
    const url = "https://api.openai.com/v1/chat/completions";

    const prompt = `Tengo este vehículo para vender:

${brand} ${model}${version ? " " + version : ""} ${year}
Kilometraje: ${km} km
${highlights?.length ? "Detalles: " + highlights.join(", ") : ""}

Escribí una descripción corta para publicar en una plataforma de autos usados en Argentina. Máximo 90 palabras. Tiene que sonar como si la escribiera una persona real que conoce el auto, no una agencia ni un robot. Sin frases de marketing exageradas, sin "joya sobre ruedas", sin "no dejes pasar esta oportunidad". Directo, natural, con los datos importantes. Podés mencionar el ${brand} ${model} ${year} al principio. Sin emojis.`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Sos un vendedor de autos usados en Argentina. Escribís descripciones cortas, claras y honestas. Nada de frases de marketing vacías. Usás lenguaje rioplatense natural." },
          { role: "user", content: prompt }
        ],
        temperature: 0.9,
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