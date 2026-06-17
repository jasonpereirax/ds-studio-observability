// api/generations/index.js — Registra e lista gerações de componentes
// POST /api/generations { project_id, component_name, model_used, tokens_in, tokens_out, cost_usd, duration_ms, status, metadata }
// GET  /api/generations?project_id=... → lista histórico
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });

  // Valida user
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseServiceKey },
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' });
  const user = await userRes.json();

  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  // POST: registra nova geração
  if (req.method === 'POST') {
    const { project_id, component_name, model_used, tokens_in, tokens_out, cost_usd, duration_ms, status, error_message, metadata } = req.body || {};
    if (!project_id || !component_name) {
      return res.status(400).json({ error: 'project_id and component_name required' });
    }

    const r = await fetch(`${supabaseUrl}/rest/v1/ds_generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        project_id,
        user_id: user.id,
        component_name,
        model_used: model_used || 'unknown',
        tokens_in: tokens_in || 0,
        tokens_out: tokens_out || 0,
        cost_usd: cost_usd || 0,
        duration_ms: duration_ms || 0,
        status: status || 'ok',
        error_message: error_message || null,
        metadata: metadata || {},
      }),
    });

    const created = ((await r.json()) || [])[0];
    return res.status(201).json({ generation: created });
  }

  // GET: lista gerações do projeto
  if (req.method === 'GET') {
    const projectId = req.query.project_id;
    if (!projectId) return res.status(400).json({ error: 'project_id query param required' });

    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const offset = parseInt(req.query.offset) || 0;

    const r = await fetch(
      `${supabaseUrl}/rest/v1/ds_generations?project_id=eq.${projectId}&select=*,profiles(login_github,name,avatar_url)&order=created_at.desc&limit=${limit}&offset=${offset}`,
      { headers }
    );
    const data = (await r.json()) || [];

    // Calcula totais
    const totalsRes = await fetch(
      `${supabaseUrl}/rest/v1/ds_generations?project_id=eq.${projectId}&select=cost_usd,tokens_in,tokens_out`,
      { headers }
    );
    const all = (await totalsRes.json()) || [];
    const totals = all.reduce((acc, g) => ({
      cost: acc.cost + parseFloat(g.cost_usd || 0),
      tokens_in: acc.tokens_in + (g.tokens_in || 0),
      tokens_out: acc.tokens_out + (g.tokens_out || 0),
      count: acc.count + 1,
    }), { cost: 0, tokens_in: 0, tokens_out: 0, count: 0 });

    return res.status(200).json({ generations: data, totals });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
