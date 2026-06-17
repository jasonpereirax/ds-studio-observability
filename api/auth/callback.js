// api/auth/callback.js — Recebe redirect do Supabase após GitHub OAuth
// GET /api/auth/callback?code=...&mode=popup
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const siteUrl = process.env.SITE_URL || `https://${req.headers.host}`;
  const mode = req.query.mode || 'redirect';
  const code = req.query.code;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // Troca o code por sessão via Supabase
  let session;
  try {
    const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=authorization_code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ code, redirect_uri: `${siteUrl}/api/auth/callback?mode=${mode}` }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Token exchange error:', data);
      return res.status(400).json({ error: 'Token exchange failed', details: data });
    }
    session = data;
  } catch (err) {
    console.error('Token exchange exception:', err);
    return res.status(500).json({ error: 'Token exchange failed' });
  }

  // Modo popup (usado pelo plugin Figma): renderiza HTML que envia postMessage
  if (mode === 'popup') {
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DS Studio — Conectado</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      background: #F2F2F0;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh;
      color: #1A1A1C;
    }
    .card {
      background: #FFFFFF;
      border-radius: 22px;
      padding: 48px 40px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 1px 3px rgba(20,20,22,.05), 0 10px 30px -12px rgba(20,20,22,.12);
    }
    .check {
      width: 56px; height: 56px;
      background: #E7F7EE;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .check svg { width: 28px; height: 28px; color: #1FA463; }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
    p { font-size: 14px; color: #6E6E70; line-height: 1.5; }
    .name { font-weight: 700; color: #1A1A1C; }
    .hint { margin-top: 24px; font-size: 12px; color: #9B9B9D; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
      </svg>
    </div>
    <h1>Conectado!</h1>
    <p>Logado como <span class="name" id="userName">...</span></p>
    <p class="hint">Esta janela fechará automaticamente.</p>
  </div>
  <script>
    const session = ${JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
      user: session.user ? {
        id: session.user.id,
        email: session.user.email,
        login: session.user.user_metadata?.user_name || session.user.user_metadata?.preferred_username,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
        avatar: session.user.user_metadata?.avatar_url,
      } : null,
    })};

    document.getElementById('userName').textContent = session.user?.name || session.user?.login || 'usuário';

    // Envia pro opener (plataforma) ou parent (plugin iframe)
    if (window.opener) {
      window.opener.postMessage({ type: 'ds-studio-auth', session }, '*');
      setTimeout(() => window.close(), 2000);
    } else if (window.parent !== window) {
      window.parent.postMessage({ type: 'ds-studio-auth', session }, '*');
      setTimeout(() => window.close(), 2000);
    }
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  // Modo redirect (padrão): redireciona pra plataforma com tokens no hash
  const params = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: String(session.expires_in),
  });
  res.redirect(302, `${siteUrl}/login#${params.toString()}`);
}
