import { useEffect, useMemo, useState } from "react";
import { Bot, Copy, GitBranch, Layers, RefreshCw, SearchCode, TriangleAlert, Wifi } from "lucide-react";
import { getSystems, type ComponentRegistryItem, type ComponentUsage, type DesignDebt, type ObservabilitySystem } from "./lib/api";
import { GlobalOverview } from "./components/GlobalOverview";
import { ProjectList } from "./components/ProjectList";
import { ProjectDetail } from "./components/ProjectDetail";
import { SnippetCard } from "./components/SnippetCard";
import { RegistryView } from "./components/RegistryView";
import { DSGraphView } from "./components/DSGraphView";
import { ImpactView } from "./components/ImpactView";
import { DesignDebtView } from "./components/DesignDebtView";
import { ReportsView } from "./components/ReportsView";
import { SoonView } from "./components/SoonView";

type ViewMode = "overview" | "project" | "install" | "registry" | "graph" | "impact" | "debt" | "reports" | "ai";

export default function App() {
  const [systems, setSystems] = useState<ObservabilitySystem[]>([]);
  const [registry, setRegistry] = useState<ComponentRegistryItem[]>([]);
  const [globalComponents, setGlobalComponents] = useState<ComponentUsage[]>([]);
  const [designDebt, setDesignDebt] = useState<DesignDebt[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await getSystems();
      setSystems(response.systems);
      setRegistry(response.registry);
      setGlobalComponents(response.globalComponents);
      setDesignDebt(response.designDebt);
      setSelectedSystemId((current) => current || response.systems[0]?.id || null);
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

  const titleMap: Record<ViewMode, string> = {
    overview: "Visão geral da utilização do Design System.",
    project: selectedSystem ? selectedSystem.name : "Observabilidade por projeto.",
    install: "Instalação do rastreador.",
    registry: "Registry de componentes.",
    graph: "Mapa relacional do Design System.",
    impact: "Impact analysis por componente.",
    debt: "Design debt operacional.",
    reports: "Reports de observabilidade.",
    ai: "AI Assistant."
  };

  const descriptionMap: Record<ViewMode, string> = {
    overview: "Entenda rapidamente quais projetos estão conectados, quantas páginas usam o DS e onde existe oportunidade de instrumentação.",
    project: "Analise origem, páginas, fluxo, estrutura e prontidão para Design System dentro de um projeto específico.",
    install: "Copie o snippet e instale no header ou footer do sistema que você deseja observar.",
    registry: "Veja os componentes oficiais do DS e compare com o uso real detectado nos sistemas conectados.",
    graph: "Explore a relação entre sistemas, jornadas, páginas e componentes em uso.",
    impact: "Entenda quais páginas e projetos seriam impactados por mudanças em um componente.",
    debt: "Priorize páginas com baixa instrumentação, botões sem rastreio e formulários sem DS.",
    reports: "Resumo exportável da adoção do Design System e saúde dos projetos conectados.",
    ai: "Em breve: perguntas e recomendações baseadas nos dados do observability."
  };

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
          <button className={viewMode === "overview" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("overview")}><i /><Layers size={16} /><span>Overview</span></button>
          <button className={viewMode === "project" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("project")}><i /><Wifi size={16} /><span>Project trace</span></button>
          <button className={viewMode === "registry" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("registry")}><i /><SearchCode size={16} /><span>Registry</span></button>
          <button className={viewMode === "graph" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("graph")}><i /><GitBranch size={16} /><span>DS Graph</span></button>
          <button className={viewMode === "impact" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("impact")}><i /><TriangleAlert size={16} /><span>Impact</span></button>
          <button className={viewMode === "debt" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("debt")}><i /><TriangleAlert size={16} /><span>Debt</span></button>
          <button className={viewMode === "reports" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("reports")}><i /><Copy size={16} /><span>Reports</span></button>
          <button className={viewMode === "install" ? "nav-item active" : "nav-item"} onClick={() => setViewMode("install")}><i /><Copy size={16} /><span>Install</span></button>
          <button className={viewMode === "ai" ? "nav-item active soon" : "nav-item soon"} onClick={() => setViewMode("ai")}><i /><Bot size={16} /><span>AI Soon</span></button>
        </nav>

        <div className="sidebar-card">
          <span className="label">Product stage</span>
          <strong>Runtime Intelligence</strong>
          <p>Overview, registry, graph, impact, debt e reports com dados reais.</p>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <span className="label accent">DS Usage Intelligence</span>
            <h1>{titleMap[viewMode]}</h1>
            <p>{descriptionMap[viewMode]}</p>
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
            <p>{error}. Verifique Supabase, migrations e endpoint /api/systems.</p>
          </div>
        )}

        {viewMode === "overview" && <GlobalOverview systems={systems} onSelectProject={selectProject} />}
        {viewMode === "project" && (
          <section className="project-layout">
            <aside className="project-rail">
              <ProjectList systems={systems} selectedSystemId={selectedSystem?.id || null} onSelectProject={selectProject} />
            </aside>
            <ProjectDetail system={selectedSystem} />
          </section>
        )}
        {viewMode === "install" && <section className="install-layout"><SnippetCard /></section>}
        {viewMode === "registry" && <RegistryView registry={registry} components={globalComponents} />}
        {viewMode === "graph" && <DSGraphView systems={systems} />}
        {viewMode === "impact" && <ImpactView components={globalComponents} systems={systems} />}
        {viewMode === "debt" && <DesignDebtView debt={designDebt} systems={systems} />}
        {viewMode === "reports" && <ReportsView systems={systems} components={globalComponents} debt={designDebt} />}
        {viewMode === "ai" && <SoonView />}
      </section>
    </main>
  );
}
