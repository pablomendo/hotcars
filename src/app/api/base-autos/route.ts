import { NextResponse } from 'next/server';
import baseData from './db_7f8e9a2b1c4d.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category')?.toUpperCase().trim();
    const brand = searchParams.get('brand')?.toUpperCase().trim();
    const model = searchParams.get('model')?.toUpperCase().trim(); 

    if (!category) return NextResponse.json([]);

    // @ts-ignore
    const categoryData = baseData[category] || {};

    if (!brand) {
      return NextResponse.json(Object.keys(categoryData).sort());
    }

    const brandData = categoryData[brand] || {};

    if (!model) {
      return NextResponse.json(Object.keys(brandData).sort());
    }

    const versiones = brandData[model] || [];
    
    return NextResponse.json(Array.isArray(versiones) ? versiones.sort() : []);
    
  } catch (error) {
    console.error("Error en API base-autos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}