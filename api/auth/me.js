// api/auth/me.js — Retorna perfil do usuário autenticado
// GET /api/auth/me (Bearer token)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = (req.headers.authorization || '').replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Missing token' });

  // 1. Valida o token e pega o user
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseServiceKey },
  });
  if (!userRes.ok) return res.status(401).json({ error: 'Invalid token' });
  const user = await userRes.json();

  // 2. Busca perfil + admin + orgs + projetos em paralelo
  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
  };

  const [profileRes, adminRes, orgsRes, projectsRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=*`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/platform_admins?user_id=eq.${user.id}&select=user_id`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/org_members?user_id=eq.${user.id}&select=role,organizations(id,name,slug,logo_url)`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/project_members?user_id=eq.${user.id}&select=role,ds_projects(id,name,slug,repo_full_name,vercel_url,accent_color)`, { headers }),
  ]);

  const profile = ((await profileRes.json()) || [])[0] || null;
  const isAdmin = ((await adminRes.json()) || []).length > 0;
  const orgs = ((await orgsRes.json()) || []).map(m => ({ ...m.organizations, role: m.role }));
  const projects = ((await projectsRes.json()) || []).map(m => ({ ...m.ds_projects, role: m.role }));

  // 3. Adiciona projetos que o user é owner direto (não via project_members)
  const ownedRes = await fetch(
    `${supabaseUrl}/rest/v1/ds_projects?owner_id=eq.${user.id}&select=id,name,slug,repo_full_name,vercel_url,accent_color`,
    { headers }
  );
  const owned = (await ownedRes.json()) || [];
  const projectIds = new Set(projects.map(p => p.id));
  for (const p of owned) {
    if (!projectIds.has(p.id)) {
      projects.push({ ...p, role: 'owner' });
    }
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      login: profile?.login_github || user.user_metadata?.user_name,
      name: profile?.name || user.user_metadata?.full_name,
      avatar: profile?.avatar_url || user.user_metadata?.avatar_url,
    },
    isAdmin,
    orgs,
    projects,
  });
}
