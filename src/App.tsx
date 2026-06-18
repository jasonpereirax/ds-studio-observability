import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, Copy, GitBranch, Globe2, Layers, RefreshCw, Wifi } from "lucide-react";
import { getSystems, type ObservabilitySystem } from "./lib/api";
import { StatusBadge } from "./components/StatusBadge";
import { SnippetCard } from "./components/SnippetCard";
import { FlowMap } from "./components/FlowMap";
import { PagesTable } from "./components/PagesTable";
import { ConnectionDetails } from "./components/ConnectionDetails";
import { PageStructureCard } from "./components/PageStructureCard";
import { DSReadinessCard } from "./components/DSReadinessCard";
import { TechnicalContextCard } from "./components/TechnicalContextCard";

export default function App() {
  const [systems, setSystems] = useState<ObservabilitySystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await getSystems();
      setSystems(response);
      setSelectedSystemId((current) => current || response[0]?.id || null);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 5000);
    return () => window.clearInterval(interval);
  }, []);

  const selectedSystem = useMemo(() => {
    return systems.find((system) => system.id === selectedSystemId) || systems[0] || null;
  }, [systems, selectedSystemId]);

  const connected = Boolean(selectedSystem?.connected);
  const latestSignal = selectedSystem?.last_seen_at
    ? new Date(selectedSystem.last_seen_at).toLocaleString("pt-BR")
    : "—";

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
          <button className="nav-item active"><i /><Wifi size={16} /><span>Connection</span></button>
          <button className="nav-item"><i /><Layers size={16} /><span>Active pages</span></button>
          <button className="nav-item"><i /><GitBranch size={16} /><span>Flow</span></button>
          <button className="nav-item"><i /><Copy size={16} /><span>Install</span></button>
        </nav>

        <div className="sidebar-card">
          <span className="label">Current module</span>
          <strong>Simple Connect</strong>
          <p>Conexão, origem, páginas ativas e fluxo detectado.</p>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <span className="label accent">Simple Observability Module</span>
            <h1>Conecte qualquer sistema com um script.</h1>
            <p>O usuário cola um código no header ou footer. O painel mostra origem conectada, páginas ativas e fluxo de navegação.</p>
          </div>

          <div className="topbar-actions">
            {selectedSystem?.sourceOrigin && (
              <a className="button secondary" href={selectedSystem.sourceOrigin} target="_blank" rel="noreferrer">
                <Globe2 size={16} /> Abrir origem
              </a>
            )}
            <button className="button primary" onClick={load} disabled={loading}>
              <RefreshCw size={16} /> {loading ? "Atualizando" : "Atualizar"}
            </button>
          </div>
        </header>

        {error && (
          <div className="error-box">
            <strong>Erro ao carregar dados</strong>
            <p>{error}. Verifique as variáveis de ambiente e o endpoint /api/systems.</p>
          </div>
        )}

        <section className="stats-grid">
          <article className="status-card panel">
            <div className="status-card-main">
              <StatusBadge connected={connected} />
              <div>
                <span className="label">Connection status</span>
                <h2>{connected ? "Conectado" : "Não conectado"}</h2>
                <p>{selectedSystem ? `${selectedSystem.name} · ${selectedSystem.sourceHost || "origem não identificada"}` : "Nenhum sistema enviou heartbeat ainda."}</p>
              </div>
            </div>

            <div className="status-meta">
              <span>Último sinal</span>
              <strong>{latestSignal}</strong>
            </div>
          </article>

          <article className="stat-card panel">
            <Activity size={18} />
            <span className="label">Active pages</span>
            <strong>{selectedSystem?.activePages || 0}</strong>
            <p>{selectedSystem?.activePages === 1 ? "página mapeada" : "páginas mapeadas"}</p>
          </article>

          <article className="stat-card panel">
            <GitBranch size={18} />
            <span className="label">Detected flows</span>
            <strong>{selectedSystem?.journeys || 0}</strong>
            <p>{selectedSystem?.journeys === 1 ? "jornada ativa" : "jornadas ativas"}</p>
          </article>
        </section>

        <section className="bento-grid">
          <article className="panel source-panel">
            <div className="panel-header">
              <div>
                <span className="label accent">Connected source</span>
                <h2>De onde está conectado</h2>
              </div>
              {selectedSystem?.sourceUrl && (
                <a className="icon-button" href={selectedSystem.sourceUrl} target="_blank" rel="noreferrer">
                  <ArrowUpRight size={18} />
                </a>
              )}
            </div>
            <ConnectionDetails system={selectedSystem} />
          </article>

          <article className="panel systems-panel">
            <div className="panel-header">
              <div>
                <span className="label accent">Systems</span>
                <h2>Sistemas conectados</h2>
              </div>
            </div>
            <div className="systems-list">
              {systems.length ? systems.map((system) => (
                <button
                  key={system.id}
                  className={system.id === selectedSystem?.id ? "system-row selected" : "system-row"}
                  onClick={() => setSelectedSystemId(system.id)}
                >
                  <span><strong>{system.name}</strong><small>{system.sourceHost || system.id}</small></span>
                  <StatusBadge connected={system.connected} />
                </button>
              )) : (
                <div className="empty-state">
                  <strong>Nenhum sistema conectado ainda</strong>
                  <p>Instale o snippet em um site para ver a primeira conexão aqui.</p>
                </div>
              )}
            </div>
          </article>

          <SnippetCard />

          <article className="panel pages-panel">
            <div className="panel-header">
              <div>
                <span className="label accent">Active pages</span>
                <h2>Páginas mapeadas</h2>
              </div>
            </div>
            <PagesTable pages={selectedSystem?.pages || []} />
          </article>

          <article className="panel flow-panel">
            <div className="panel-header">
              <div>
                <span className="label accent">Journey flow</span>
                <h2>Fluxo detectado</h2>
              </div>
            </div>
            <FlowMap pages={selectedSystem?.pages || []} />
          </article>

<PageStructureCard system={selectedSystem} />
<DSReadinessCard system={selectedSystem} />
<TechnicalContextCard system={selectedSystem} />
          
        </section>
      </section>
    </main>
  );
}
