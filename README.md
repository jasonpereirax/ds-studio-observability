# DS Studio Observability

Módulo independente de observabilidade para acompanhar adoção, cobertura e dívida de instrumentação do Design System em produtos conectados.

O produto evoluiu de um simples sinal de "site conectado" para uma camada de **DS Usage Intelligence**:

- projetos conectados
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

## APIs

`POST /api/collect`

Recebe eventos do tracker, registra o sistema, grava page events, uso de componentes e sinais de design debt.

`GET /api/systems`

Agrega sistemas, páginas, registry, component usage e design debt para o dashboard.

`GET /api/health`

Verifica se o módulo está respondendo.

## Notas De Produto

AI Assistant permanece propositalmente como `Soon`. A prioridade atual é amadurecer a camada de dados: coleta confiável, registry, component usage, graph, impact analysis, design debt e reports.

No repositório principal do DS Studio, o `App.tsx` pode ser auto-regenerado. Por isso, este módulo continua isolado e pode ser integrado depois por rota, subdomínio ou iframe.
