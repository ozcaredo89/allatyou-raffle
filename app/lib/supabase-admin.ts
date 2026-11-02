import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con service_role.
 * SOLO importar desde Route Handlers -- nunca desde componentes 'use client'.
 * El service_role bypasea RLS, por lo que tiene permisos de escritura completos.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
