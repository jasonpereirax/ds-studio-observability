// api/projects/[id].js — CRUD de um projeto específico
// GET    /api/projects/[id] → detalhes + membros
// PATCH  /api/projects/[id] → atualiza campos
// DELETE /api/projects/[id] → remove projeto
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const projectId = req.query.id;
  if (!projectId) return res.status(400).json({ error: 'Project ID required' });

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

  // GET: detalhes + membros
  if (req.method === 'GET') {
    const [projRes, membersRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/ds_projects?id=eq.${projectId}&select=*`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/project_members?project_id=eq.${projectId}&select=role,joined_at,profiles(id,login_github,name,avatar_url)`, { headers }),
    ]);

    const project = ((await projRes.json()) || [])[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const members = ((await membersRes.json()) || []).map(m => ({
      ...m.profiles,
      role: m.role,
      joined_at: m.joined_at,
    }));

    return res.status(200).json({ project, members });
  }

  // PATCH: atualiza
  if (req.method === 'PATCH') {
    // Verifica permissão (owner ou admin)
    const projCheck = await fetch(`${supabaseUrl}/rest/v1/ds_projects?id=eq.${projectId}&select=owner_id`, { headers });
    const proj = ((await projCheck.json()) || [])[0];
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const isOwner = proj.owner_id === user.id;
    const isAdminRes = await fetch(`${supabaseUrl}/rest/v1/platform_admins?user_id=eq.${user.id}&select=user_id`, { headers });
    const isAdmin = ((await isAdminRes.json()) || []).length > 0;
    const isMemberAdmin = await fetch(
      `${supabaseUrl}/rest/v1/project_members?project_id=eq.${projectId}&user_id=eq.${user.id}&role=in.(owner,admin)&select=role`,
      { headers }
    );
    const hasRole = ((await isMemberAdmin.json()) || []).length > 0;

    if (!isOwner && !isAdmin && !hasRole) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Campos permitidos
    const allowed = ['name', 'tagline', 'accent_color', 'vercel_url', 'repo_full_name', 'visibility', 'password_hash'];
    const updates = {};
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    const r = await fetch(`${supabaseUrl}/rest/v1/ds_projects?id=eq.${projectId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updates),
    });
    const updated = ((await r.json()) || [])[0];
    return res.status(200).json({ project: updated });
  }

  // DELETE
  if (req.method === 'DELETE') {
    const projCheck = await fetch(`${supabaseUrl}/rest/v1/ds_projects?id=eq.${projectId}&select=owner_id`, { headers });
    const proj = ((await projCheck.json()) || [])[0];
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const isOwner = proj.owner_id === user.id;
    const isAdminRes = await fetch(`${supabaseUrl}/rest/v1/platform_admins?user_id=eq.${user.id}&select=user_id`, { headers });
    const isAdmin = ((await isAdminRes.json()) || []).length > 0;

    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'Not authorized' });

    await fetch(`${supabaseUrl}/rest/v1/ds_projects?id=eq.${projectId}`, {
      method: 'DELETE',
      headers,
    });

    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
