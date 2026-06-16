import { useEffect, useMemo, useState } from 'react';
import { Activity, Copy, GitBranch, Layers, RefreshCw, Wifi } from 'lucide-react';
import { getSystems, type ObservabilitySystem } from './lib/api';
import { StatusBadge } from './components/StatusBadge';
import { SnippetCard } from './components/SnippetCard';
import { FlowMap } from './components/FlowMap';
import { PagesTable } from './components/PagesTable';

export default function App() {
  const [systems, setSystems] = useState<ObservabilitySystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await getSystems();
      setSystems(response);
      setSelectedSystemId((current) => current || response[0]?.id || null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedSystem = useMemo(() => systems.find((system) => system.id === selectedSystemId) || systems[0] || null, [systems, selectedSystemId]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">D</div>
          <div>
            <strong>DS Studio</strong>
            <span>Observability</span>
          </div>
        </div>
        <nav className="nav-list">
          <button className="nav-item active"><Wifi size={16} />Connection</button>
          <button className="nav-item"><Layers size={16} />Active pages</button>
          <button className="nav-item"><GitBranch size={16} />Flow</button>
          <button className="nav-item"><Copy size={16} />Install</button>
        </nav>
        <div className="sidebar-card">
          <p className="caption">Current module</p>
          <strong>Simple Connect</strong>
          <p>Conexão, páginas ativas e fluxo detectado.</p>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">Simple Observability Module</span>
            <h1>Conecte qualquer sistema com um script.</h1>
            <p>O usuário cola um código no header ou footer. O painel mostra se está conectado, páginas ativas e fluxo de navegação.</p>
          </div>
          <button className="button primary" onClick={load} disabled={loading}>
            <RefreshCw size={16} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </header>

        {error && <div className="error-box"><strong>Erro:</strong> {error}<p>Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.</p></div>}

        <section className="hero-grid">
          <article className="status-card">
            <StatusBadge connected={Boolean(selectedSystem?.connected)} />
            <div>
              <span className="caption">Connection status</span>
              <h2>{selectedSystem?.connected ? 'Conectado' : 'Não conectado'}</h2>
              <p>{selectedSystem ? `${selectedSystem.name} · último sinal ${selectedSystem.last_seen_at ? new Date(selectedSystem.last_seen_at).toLocaleString('pt-BR') : '—'}` : 'Nenhum sistema enviou heartbeat ainda.'}</p>
            </div>
          </article>
          <article className="metric-card"><Activity size={18} /><span>Páginas ativas</span><strong>{selectedSystem?.activePages || 0}</strong></article>
          <article className="metric-card"><GitBranch size={18} /><span>Fluxos detectados</span><strong>{selectedSystem?.journeys || 0}</strong></article>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="panel-header"><div><span className="caption">Systems</span><h2>Sistemas conectados</h2></div></div>
            <div className="systems-list">
              {systems.length ? systems.map((system) => (
                <button key={system.id} className={system.id === selectedSystem?.id ? 'system-row selected' : 'system-row'} onClick={() => setSelectedSystemId(system.id)}>
                  <span><strong>{system.name}</strong><small>{system.id}</small></span>
                  <StatusBadge connected={system.connected} />
                </button>
              )) : <div className="empty">Nenhum sistema conectado ainda.</div>}
            </div>
          </article>
          <SnippetCard />
        </section>

        <section className="content-grid">
          <article className="panel"><div className="panel-header"><div><span className="caption">Active pages</span><h2>Páginas mapeadas</h2></div></div><PagesTable pages={selectedSystem?.pages || []} /></article>
          <article className="panel"><div className="panel-header"><div><span className="caption">Journey flow</span><h2>Fluxo detectado</h2></div></div><FlowMap pages={selectedSystem?.pages || []} /></article>
        </section>
      </section>
    </main>
  );
}
