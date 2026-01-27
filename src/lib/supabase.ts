import { createClient } from '@supabase/supabase-js'

// Configuración directa con tus credenciales de HotCars
const supabaseUrl = 'https://xkwkgcjgxjvidiwthwbr.supabase.co'
const supabaseAnonKey = 'sb_publishable_Ou5RH-wPn0_LDs3F8hd-5w_5gSWvlDF'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)