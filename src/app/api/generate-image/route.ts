import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand, model, year, imageBase64 } = body;

    // --- TU PROMPT ORIGINAL (RESTAURADO ÍNTEGRO) ---
    const prompt = `You are editing a real car photo for a marketplace listing.
    Vehicle: ${brand} ${model} ${year}.

    STRICT RULES:
    - The car from the original photo MUST remain EXACTLY the same.
    - Do NOT modify the car’s paint, reflections, dents, scratches, wheels, lights, badges, windows or proportions.
    - Do NOT beautify, repair, polish or alter the vehicle in any way.
    - The vehicle must be the exact same object from the source image.
    - Only isolate (cut out) the car and place it into a new environment.

    COMPOSITION:
    - Output image must be vertical 9:16.
    - The car must be centered in the frame.
    - The car must occupy approximately 25–33% of the image height.
    - The remaining space should emphasize environment and depth.

    ENVIRONMENT:
    Generate a realistic environment that matches the lighting and perspective of the car.
    Possible environments: Empty parking lot, Quiet Argentine neighborhood street, Open road in the distance, Subtle city background, Coastal road near a beach.
    The location must feel realistic and natural, not cinematic or exaggerated.

    DEPTH & PHOTOGRAPHY STYLE:
    - Use natural depth of field in the background.
    - The car must remain sharp and untouched.
    - Background slightly blurred but realistic.
    - Natural photography look, not CGI, not illustration.

    LIGHTING:
    - Lighting must match the original car photo.
    - Acceptable conditions: overcast sky, cloudy day with sun diffusion, or neutral daylight.
    - Shadows and reflections must remain consistent with the original vehicle.

    INTEGRATION:
    - The vehicle must blend perfectly with the new background.
    - Perspective, scale and ground contact must look physically correct.

    FINAL RESULT:
    A clean marketplace cover image where the real car is centered and untouched, placed in a neutral and aesthetically pleasing environment.`;

    // 1. Subir la imagen original
    const uploadRes = await cloudinary.uploader.upload(imageBase64, {
      folder: "hotcars_ia_temp",
    });

    // 2. Limpieza agresiva de caracteres especiales para la URL
    // Cloudinary falla si hay comas, paréntesis o saltos de línea mal escapados
    const urlSafePrompt = prompt
      .replace(/\n/g, ' ')
      .replace(/[^a-zA-Z0-9\s:-]/g, '') // Quitamos puntos, comas y símbolos raros que rompen la URL
      .replace(/\s+/g, ' ')
      .trim();

    // 3. Generar la URL de transformación
    const improvedUrl = cloudinary.url(uploadRes.public_id, {
      transformation: [
        {
          effect: `gen_background_replace:prompt_${urlSafePrompt}`
        },
        { width: 1080, height: 1920, crop: "fill", gravity: "center" },
        { quality: "auto", fetch_format: "auto" }
      ],
      secure: true
    });

    // Importante: Para evitar el error de "Error in loading", 
    // forzamos una espera o devolvemos la URL directamente.
    return NextResponse.json({ image: improvedUrl });

  } catch (error: any) {
    console.error("CLOUDINARY_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}