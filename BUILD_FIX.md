# Build fix

O erro da Vercel acontecia porque o `tsconfig.json` usava:

```json
"moduleResolution": "Node"
```

Nas versões novas do TypeScript isso é interpretado como `node10`, que agora gera erro/depreciação em build.

Correção aplicada:

```json
"moduleResolution": "Bundler",
"ignoreDeprecations": "6.0"
```

Também foi fixada a versão do TypeScript em `5.9.3` para evitar que `latest` instale uma versão futura incompatível sem aviso.
