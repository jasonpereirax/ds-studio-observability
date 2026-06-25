# DS Studio Observability

Módulo independente de observabilidade para acompanhar adoção, cobertura e dívida de instrumentação do Design System em produtos conectados.

O produto evoluiu de um simples sinal de "site conectado" para uma camada de **DS Usage Intelligence**:

- projetos conectados
- cobertura monitorada por URL
- páginas e jornadas mapeadas
- metadata de página e contexto técnico
- runtime component tracking com `data-ds-component`
- component registry
- DS graph
- impact analysis
- design debt
- reports
- AI Assistant marcado como `Soon`

Stack: Vite, React, TypeScript, Vercel API Functions e Supabase.

## Como Rodar

```bash
npm install
npm run dev
```

Para validar produção local:

```bash
npm run build
npm run preview
```

## Banco De Dados

Use Supabase.

Para um projeto novo, rode:

```txt
supabase/schema.sql
```

Para um banco antigo criado com o MVP inicial, rode:

```txt
supabase/2026-06-18-product-evolution.sql
```

Para evoluir um banco que já tinha a camada de product evolution, rode também:

```txt
supabase/2026-06-25-platform-evolution.sql
```

Para bancos que já estavam na platform evolution antes do monitoramento ativo, rode:

```txt
supabase/2026-06-25-active-coverage-monitoring.sql
```

Depois configure as variáveis na Vercel:

```txt
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Deploy

Este módulo roda como projeto separado na Vercel.

Endpoint de saúde:

```txt
https://SEU-DOMINIO.vercel.app/api/health
```

Endpoint de leitura do dashboard:

```txt
https://SEU-DOMINIO.vercel.app/api/systems
```

Endpoint de coleta:

```txt
https://SEU-DOMINIO.vercel.app/api/collect
```

Endpoint de checagem ativa de cobertura:

```txt
https://SEU-DOMINIO.vercel.app/api/coverage-check
```

## Snippet Para Site Externo

```html
<script src="https://SEU-DOMINIO.vercel.app/ds-connect.js"></script>
<script>
  DSStudioConnect.init({
    publicKey: "PUBLIC_KEY",
    endpoint: "https://SEU-DOMINIO.vercel.app/api/collect",
    environment: "production",
    debug: true
  });
</script>
```

Também é possível informar `systemId`, `systemName` e `journey` manualmente. Quando omitidos, o tracker infere o sistema pelo hostname e a jornada pelo path.

## Marcação De Componentes

Para alimentar registry, graph e impact analysis, marque componentes do Design System no produto observado:

```html
<button
  data-ds-component="Button"
  data-ds-version="1.0.0"
  data-ds-variant="primary"
  data-ds-token="action-primary">
  Comprar
</button>
```

O tracker também identifica sinais de dívida quando encontra páginas conectadas sem componentes DS, botões sem instrumentação ou formulários sem marcação.

## Checagem Ativa De Cobertura

O runtime tracker depende de uma página ser aberta em algum navegador. Para cobertura arquitetural, use o endpoint de checagem ativa.

```bash
curl -X POST https://SEU-DOMINIO.vercel.app/api/coverage-check \
  -H "Content-Type: application/json" \
  -H "x-ds-monitor-key: MONITOR_KEY" \
  -d '{
    "urls": [
      {
        "url": "https://produto.exemplo.com/",
        "systemId": "produto-exemplo",
        "systemName": "Produto Exemplo",
        "environment": "production"
      }
    ]
  }'
```

Se `OBSERVABILITY_MONITOR_KEY` estiver configurada, o header `x-ds-monitor-key` é obrigatório.

A checagem ativa visita a URL, detecta presença do snippet no HTML, extrai marcadores `data-ds-component` disponíveis no documento inicial e atualiza:

- `observability_monitored_urls`
- `observability_coverage_checks`
- `observability_pages`
- `observability_component_inventory`

Runtime activity e coverage monitoring são sinais diferentes. A dashboard deve usar coverage monitoring para cobertura e runtime activity para saúde de execução.

## APIs

`POST /api/collect`

Recebe eventos do tracker, registra o sistema, grava page events, uso de componentes e sinais de design debt.

O endpoint também mantém estado atual por página, inventário atual de componentes e findings ativos deduplicados.

`GET /api/systems`

Agrega sistemas, páginas, registry, component usage, findings ativos, scores e design debt para o dashboard.

`GET /api/health`

Verifica se o módulo está respondendo.

`POST /api/coverage-check`

Executa uma checagem ativa de cobertura em URLs informadas ou nas URLs monitoradas ativas.

## Notas De Produto

AI Assistant permanece propositalmente como `Soon`. A prioridade atual é amadurecer a camada de dados: coleta confiável, registry, component usage, graph, impact analysis, design debt e reports.

No repositório principal do DS Studio, o `App.tsx` pode ser auto-regenerado. Por isso, este módulo continua isolado e pode ser integrado depois por rota, subdomínio ou iframe.
