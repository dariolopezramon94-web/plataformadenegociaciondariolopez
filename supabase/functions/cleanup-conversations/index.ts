// supabase/functions/cleanup-conversations/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.6';

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Eliminar conversaciones con más de 24 horas de inactividad
  const { error, count } = await supabase
    .from('conversations')
    .delete({ count: 'exact' })
    .lt('updated_at', cutoff.toISOString())
    .eq('is_active', true);

  if (error) {
    console.error('Error al limpiar conversaciones:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({ success: true, deleted: count }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});