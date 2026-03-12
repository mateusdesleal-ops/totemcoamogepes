# TOTEM Coamo (Site + API de Vagas)

Este repositório contém:
- Site estático do TOTEM (HTML/CSS/JS)
- Endpoint `/api/vagas` (Serverless) para buscar vagas no Jobfeed da Selecty

## Como publicar (Vercel)
1. Suba este projeto no GitHub
2. Importe na Vercel (New Project → Import Git Repository)
3. Configure as variáveis de ambiente em **Settings → Environment Variables**:

- `SELECTY_PORTAL` = `coamo`
- `SELECTY_JOBFEED_KEY` = (seu token do Jobfeed)

4. Faça Redeploy

## Teste rápido
Acesse:
`https://SEU-DOMINIO.vercel.app/api/vagas`

Se retornar JSON com vagas, está OK ✅


## Observação da versão corrigida
- O endpoint `/api/vagas` agora traz automaticamente todas as páginas do Jobfeed, até o limite de segurança configurado no proxy.
- A página de vagas do site passou a aceitar retornos com `vacancies`, `data`, `jobs`, `items` e formatos semelhantes.
- O layout foi ajustado para telas de totem/webview, evitando sobra branca e cortes indevidos.
