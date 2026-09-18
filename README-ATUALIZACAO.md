# Redesign profissional — Totem Coamo / GEPES

Esta pasta contém os arquivos revisados para substituir os arquivos equivalentes no repositório atual.

## Arquivos alterados
- `index.html`
- `vagas.html`
- `sorteio.html`
- `apresentacao.html`
- `mapa.html`
- `styles.css`
- `app.js`

A pasta `assets` e a API `/api/vagas` continuam sendo usadas como já existem no repositório.

## O que mudou
- Interface redesenhada especificamente para **totem touch**.
- Alvos de toque maiores e navegação sem dependência de `hover`.
- Home com painel dinâmico de vagas abertas.
- Página de vagas com filtros maiores, filtros por área e modal de detalhes.
- Remoção das vagas fictícias de fallback em produção.
- Modo apresentação refeito.
- Vagas no modo apresentação limitadas a um conjunto de destaques para evitar um loop excessivamente longo.
- Fotos de vaga agora são usadas apenas com **correspondência estrita do título do cargo**.
- Quando não existe uma foto segura, é usado um **visual institucional por área** (Campo & Agro, Indústria ou Administrativo), evitando foto errada.
- Sorteio padronizado com a mesma identidade visual do restante do totem.
- Página antiga de placeholder removida/substituída.
- CSS consolidado; sem as várias camadas de hotfixes do arquivo anterior.
- Temporizador de inatividade considera toque, scroll, teclado e digitação.
- O modo apresentação automático não é iniciado durante o preenchimento do sorteio.

## Publicação recomendada
1. Faça backup ou crie uma branch no GitHub.
2. Substitua os 7 arquivos acima.
3. Não altere `api/vagas.js` nem as variáveis `SELECTY_PORTAL` / `SELECTY_JOBFEED_KEY`.
4. Aguarde o deploy automático da Vercel.
5. Teste em tela touch na resolução real do totem.

## Ajustes rápidos
No topo de `app.js`:
- `inactivityMs`: tempo sem interação antes da apresentação automática.
- `slideMs`: tempo de cada slide.
- `presentationVacancyLimit`: quantidade máxima de vagas no modo apresentação.
