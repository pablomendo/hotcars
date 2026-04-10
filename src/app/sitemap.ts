import { MetadataRoute } from 'next'
// Importás tu cliente de Supabase o DB
// import { getActiveFlips } from '@/lib/api' 

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://hotcars.com.ar'

  // Aquí traerías dinámicamente los slugs de tus autos/agencias
  // const flips = await getActiveFlips()
  // const flipUrls = flips.map(flip => ({
  //   url: `${baseUrl}/flips/${flip.slug}`,
  //   lastModified: new Date(),
  // }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // ...flipUrls
  ]
}