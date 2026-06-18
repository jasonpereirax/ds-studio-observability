import { useEffect, useMemo, useState } from "react";
import { Copy, GitBranch, Layers, RefreshCw, Wifi } from "lucide-react";
import { getSystems, type ObservabilitySystem } from "./lib/api";
import { GlobalOverview } from "./components/GlobalOverview";
import { ProjectList } from "./components/ProjectList";
import { ProjectDetail } from "./components/ProjectDetail";
import { SnippetCard } from "./components/SnippetCard";

type ViewMode = "overview" | "project" | "install";

export default function App() {
  const [systems, setSystems] = useState<ObservabilitySystem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
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

  const title =
    viewMode === "overview"
      ? "Visão geral da utilização do Design System."
      : viewMode === "install"
        ? "Instalação do rastreador."
        : selectedSystem
          ? selectedSystem.name
          : "Observabilidade por projeto.";

  const description =
    viewMode === "overview"
      ? "Entenda rapidamente quais projetos estão conectados, quantas páginas usam o DS e onde existe oportunidade de instrumentação."
      : viewMode === "install"
        ? "Copie o snippet e instale no header ou footer do sistema que você deseja observar."
        : "Analise origem, páginas, fluxo, estrutura e prontidão para Design System dentro de um projeto específico.";

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

          <button className="nav-item" onClick={() => setViewMode("project")}>
            <i /><GitBranch size={16} /><span>Flows</span>
          </button>

          <button className={viewMode === "install" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("install")}>
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
              {viewMode === "overview"
                ? "Design System Usage Overview"
                : viewMode === "install"
                  ? "Tracking setup"
                  : "Project Observability"}
            </span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="topbar-actions">
            {viewMode !== "overview" && (
              <button className="button secondary" onClick={() => setViewMode("overview")}>
                Voltar ao overview
              </button>
            )}

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

        {viewMode === "overview" && (
          <GlobalOverview systems={systems} onSelectProject={selectProject} />
        )}

        {viewMode === "project" && (
          <section className="project-layout">
            <aside className="project-rail">
              <ProjectList systems={systems} selectedSystemId={selectedSystem?.id || null} onSelectProject={selectProject} />
            </aside>

            <ProjectDetail system={selectedSystem} />
          </section>
        )}

        {viewMode === "install" && (
          <section className="install-layout">
            <SnippetCard />
          </section>
        )}
      </section>
    </main>
  );
}
