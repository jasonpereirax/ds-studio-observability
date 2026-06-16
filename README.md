# DS Studio Observability Module

Módulo independente para testar e evoluir a camada de Observabilidade do DS Studio.

Compatível com a stack do repositório principal: Vite + React + TypeScript + Vercel API Functions.

## O que este MVP faz

1. Mostra se o sistema está conectado.
2. Conta páginas ativas.
3. Agrupa páginas por fluxo/jornada.
4. Gera snippet para instalar em qualquer site.
5. Recebe eventos via `/api/collect`.
6. Lê dados via `/api/systems`.

## Como rodar

```bash
npm install
npm run dev
```

## Banco de dados

Use Supabase.

1. Crie um projeto no Supabase.
2. Rode `supabase/schema.sql`.
3. Configure na Vercel:

```txt
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Deploy

Suba esse pacote como projeto separado na Vercel.

## Teste de saúde

```txt
https://SEU-DOMINIO.vercel.app/api/health
```

## Snippet para site externo

```html
<script src="https://SEU-DOMINIO.vercel.app/ds-connect.js"></script>
<script>
  DSStudioConnect.init({
    systemId: "hustlin-goods-store",
    systemName: "Hustlin Goods Store",
    publicKey: "PUBLIC_KEY",
    endpoint: "https://SEU-DOMINIO.vercel.app/api/collect"
  });
</script>
```

## Importante

No repositório principal do DS Studio, o README informa que o `App.tsx` é auto-regenerado. Portanto, não recomendo editar o `App.tsx` principal manualmente. Use este módulo separado agora e integre depois por rota, subdomínio ou iframe.
