import { createClient } from '@supabase/supabase-js'

// Chave PÚBLICA (publishable) — a segurança real é login do Supabase + RLS no banco.
const SUPABASE_URL = 'https://vmtkemyvpesduoadbxca.supabase.co'
const SUPABASE_KEY = 'sb_publishable_w4xlfdyX8LBoOeKbpt9KQA_RY3JMh4t'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const IMAGES_BUCKET = 'portfolio-images'
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
