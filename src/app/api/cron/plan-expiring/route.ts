import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service role, no la anon key
);

export async function GET(request: Request) {
  // Proteger el endpoint con un secret para que solo Vercel lo llame
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Buscar usuarios cuyo plan vence en exactamente 7 días
    const target = new Date();
    target.setDate(target.getDate() + 7);
    const targetDate = target.toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: users, error } = await supabase
      .from('usuarios')
      .select('id, auth_id, plan_type, plan_expires_at')
      .not('plan_expires_at', 'is', null)
      .neq('plan_type', 'free')
      .gte('plan_expires_at', `${targetDate}T00:00:00`)
      .lt('plan_expires_at',  `${targetDate}T23:59:59`);

    if (error) throw error;

    const results = [];

    for (const user of users ?? []) {
      const eventKey = `plan_expiring_7d_${user.id}_${targetDate}`;

      // Verificar que no existe ya
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('event_key', eventKey)
        .maybeSingle();

      if (existing) {
        results.push({ user_id: user.auth_id, status: 'skipped' });
        continue;
      }

      const { error: insertError } = await supabase.from('notifications').insert({
        user_id: user.auth_id,
        type: 'plan_expiring',
        category: 'system',
        title: 'Tu plan está por vencer',
        body: `Tu plan ${user.plan_type} vence en 7 días. Renovalo para no perder acceso.`,
        action_url: '/planes',
        priority: 3,
        event_key: eventKey,
      });

      results.push({
        user_id: user.auth_id,
        status: insertError ? 'error' : 'notified',
        error: insertError?.message,
      });
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}