// api/projects/index.js — Lista e cria projetos
// GET  /api/projects (Bearer token) → lista projetos do user
// POST /api/projects (Bearer token) { name, slug, repo_full_name, vercel_url, accent_color, tagline, org_id? }
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

  // GET: lista projetos visíveis pro user
  if (req.method === 'GET') {
    // Projetos que o user é owner OU membro
    const [ownedRes, memberRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/ds_projects?owner_id=eq.${user.id}&select=*&order=updated_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/project_members?user_id=eq.${user.id}&select=role,ds_projects(*)`, { headers }),
    ]);

    const owned = (await ownedRes.json()) || [];
    const memberOf = ((await memberRes.json()) || []).map(m => ({ ...m.ds_projects, role: m.role }));

    // Merge sem duplicar
    const ids = new Set(owned.map(p => p.id));
    const all = [...owned.map(p => ({ ...p, role: 'owner' }))];
    for (const p of memberOf) {
      if (!ids.has(p.id)) all.push(p);
    }

    return res.status(200).json({ projects: all });
  }

  // POST: cria novo projeto
  if (req.method === 'POST') {
    const { name, slug, repo_full_name, vercel_url, accent_color, tagline, org_id } = req.body || {};
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });

    // Verifica se slug já existe
    const existing = await fetch(`${supabaseUrl}/rest/v1/ds_projects?slug=eq.${slug}&select=id`, { headers });
    if (((await existing.json()) || []).length > 0) {
      return res.status(409).json({ error: 'Slug already exists' });
    }

    const r = await fetch(`${supabaseUrl}/rest/v1/ds_projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        slug,
        repo_full_name: repo_full_name || null,
        vercel_url: vercel_url || null,
        accent_color: accent_color || '#1FA463',
        tagline: tagline || null,
        org_id: org_id || null,
        owner_id: user.id,
      }),
    });

    const created = ((await r.json()) || [])[0];
    if (!r.ok || !created) return res.status(400).json({ error: 'Failed to create project' });

    // Auto-adiciona owner como project_member
    await fetch(`${supabaseUrl}/rest/v1/project_members`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ project_id: created.id, user_id: user.id, role: 'owner' }),
    });

    return res.status(201).json({ project: created });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
