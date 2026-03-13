-- =============================================================================
-- PASO 0: Verificar que pg_cron esté habilitado
-- =============================================================================
-- Corre esta línea primero. Debe devolver una fila con 'pg_cron'.
-- Si no devuelve nada → ve a Dashboard → Database → Extensions → pg_cron → Enable

SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'pg_cron';

-- =============================================================================
-- PASO 1: Eliminar job anterior si existe (evita error de nombre duplicado)
-- =============================================================================

SELECT cron.unschedule('release-expired-ticket-reservations');

-- =============================================================================
-- PASO 2: Crear el job con schema explícito en la query
-- =============================================================================
-- IMPORTANTE: Supabase usa el schema "public" por defecto pero pg_cron
-- ejecuta la query en contexto del usuario "postgres". Especificamos el
-- schema explícitamente dentro de la query para evitar ambigüedades.

SELECT cron.schedule(
  'release-expired-ticket-reservations',
  '* * * * *',
  $$
    UPDATE public.rafle_tickets
    SET
      status      = 'available',
      customer_id = NULL,
      reserved_at = NULL
    WHERE
      status      = 'reserved'
      AND reserved_at IS NOT NULL
      AND reserved_at < (NOW() - INTERVAL '15 minutes');
  $$
);

-- =============================================================================
-- PASO 3: Confirmar que el job quedó registrado
-- =============================================================================

SELECT jobid, jobname, schedule, command, active
FROM cron.job
WHERE jobname = 'release-expired-ticket-reservations';

-- =============================================================================
-- PASO 4 (opcional): Ver logs de ejecución tras el primer minuto
-- =============================================================================

-- SELECT jobid, status, start_time, end_time, return_message
-- FROM cron.job_run_details
-- ORDER BY start_time DESC
-- LIMIT 10;

-- =============================================================================
-- Para eliminar el job si necesitas recrearlo:
-- SELECT cron.unschedule('release-expired-ticket-reservations');
-- =============================================================================
