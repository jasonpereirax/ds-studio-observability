import { Bot } from "lucide-react";

export function SoonView() {
  return (
    <section className="feature-grid">
      <article className="panel feature-hero soon-hero">
        <div>
          <span className="label accent">Soon</span>
          <h2>AI Assistant</h2>
          <p>Em breve: perguntas e recomendações baseadas nos dados reais de adoção, impacto e dívida do Design System.</p>
        </div>
        <Bot size={42} />
      </article>
      <article className="panel">
        <div className="empty-state">
          <strong>Não vamos adicionar IA antes da camada de dados amadurecer.</strong>
          <p>Primeiro: registry, component usage, graph, impact e design debt. Depois a IA entra para explicar, priorizar e recomendar.</p>
        </div>
      </article>
    </section>
  );
}
