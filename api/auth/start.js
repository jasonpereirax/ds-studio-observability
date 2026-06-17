// api/auth/start.js — Inicia OAuth GitHub via Supabase
// GET /api/auth/start?redirect_to=...&mode=popup
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // O redirect após login — volta pro callback do Vercel
  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
  const mode = req.query.mode || 'redirect'; // popup | redirect
  const redirectTo = `${siteUrl}/api/auth/callback?mode=${mode}`;

  // Chama Supabase Auth para iniciar o fluxo OAuth
  const authUrl = `${supabaseUrl}/auth/v1/authorize?` + new URLSearchParams({
    provider: 'github',
    redirect_to: redirectTo,
  });

  // Redireciona o browser pra tela de autorização do GitHub
  res.redirect(302, authUrl);
}
