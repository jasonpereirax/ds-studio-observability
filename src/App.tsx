import { useEffect, useMemo, useState } from "react";
import { Copy, GitBranch, Layers, RefreshCw, Wifi } from "lucide-react";
import { getSystems, type ObservabilitySystem } from "./lib/api";
import { GlobalOverview } from "./components/GlobalOverview";
import { ProjectList } from "./components/ProjectList";
import { ProjectDetail } from "./components/ProjectDetail";
import { SnippetCard } from "./components/SnippetCard";

export default function App() {
  const [systems, setSystems] = useState<ObservabilitySystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "project">("overview");
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

  function selectProject(systemId: string) {
    setSelectedSystemId(systemId);
    setViewMode("project");
  }

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
          <button className={viewMode === "overview" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("overview")}>
            <i /><Layers size={16} /><span>Overview</span>
          </button>
          <button className={viewMode === "project" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("project")}>
            <i /><Wifi size={16} /><span>Project trace</span>
          </button>
          <button className="nav-item">
            <i /><GitBranch size={16} /><span>Flows</span>
          </button>
          <button className="nav-item">
            <i /><Copy size={16} /><span>Install</span>
          </button>
        </nav>

        <div className="sidebar-card">
          <span className="label">Hierarchy</span>
          <strong>DS Usage → Project Trace</strong>
          <p>Primeiro a visão de adoção do DS. Depois o detalhe de cada sistema conectado.</p>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <span className="label accent">
              {viewMode === "overview" ? "Design System Usage Overview" : "Project Observability"}
            </span>
            <h1>
              {viewMode === "overview"
                ? "Visão geral da utilização do Design System."
                : selectedSystem
                  ? selectedSystem.name
                  : "Observabilidade por projeto."}
            </h1>
            <p>
              {viewMode === "overview"
                ? "Entenda rapidamente quais projetos estão conectados, quantas páginas usam o DS e onde existe oportunidade de instrumentação."
                : "Analise origem, páginas, fluxo, estrutura e prontidão para Design System dentro de um projeto específico."}
            </p>
          </div>

          <div className="topbar-actions">
            <button className="button secondary" onClick={() => setViewMode(viewMode === "overview" ? "project" : "overview")}>
              {viewMode === "overview" ? "Ver projeto" : "Voltar ao overview"}
            </button>
            <button className="button primary" onClick={load} disabled={loading}>
              <RefreshCw size={16} />
              {loading ? "Atualizando" : "Atualizar"}
            </button>
          </div>
        </header>

        {error && (
          <div className="error-box">
            <strong>Erro ao carregar dados</strong>
            <p>{error}. Verifique as variáveis de ambiente e o endpoint /api/systems.</p>
          </div>
        )}

        {viewMode === "overview" ? (
          <GlobalOverview systems={systems} onSelectProject={selectProject} />
        ) : (
          <section className="project-layout">
            <aside className="project-rail">
              <ProjectList systems={systems} selectedSystemId={selectedSystem?.id || null} onSelectProject={selectProject} />
              <SnippetCard />
            </aside>

            <ProjectDetail system={selectedSystem} />
          </section>
        )}
      </section>
    </main>
  );
}
