# Totem Coamo / GEPES — V2

Versão redesenhada especificamente para uso em totem touchscreen.

## O que mudou

- Home redesenhada para uso em 1920×1080.
- Modo apresentação em tela cheia com rotação automática.
- Apresentação inicia automaticamente ao abrir `index.html`.
- Um toque na apresentação abre a interface interativa.
- Após inatividade, o totem limpa campos e retorna à apresentação.
- Vagas continuam sendo consultadas pelo endpoint `/api/vagas` e Jobfeed/Selecty.
- Página de vagas com busca por cargo, filtro por cidade e QR Code.
- Página "Conheça a Coamo" substitui a antiga página placeholder de apresentação.
- Sorteio preserva o envio silencioso para o Google Forms existente.
- Painel oculto de configuração: mantenha o logo Coamo pressionado por ~3 segundos.

## Painel oculto

Permite configurar no próprio navegador:
- segundos por slide;
- segundos para retorno por inatividade;
- exibir/ocultar Sorteio;
- ativar/desativar apresentação automática ao abrir.

As configurações são salvas em `localStorage` apenas no navegador do totem.

## Vercel

Mantenha as variáveis já utilizadas pelo projeto:

- `SELECTY_PORTAL=coamo`
- `SELECTY_JOBFEED_KEY=<token do Jobfeed>`

O endpoint serverless permanece em `api/vagas.js`.

## Uso recomendado

Abra no navegador do totem:

`https://SEU-DOMINIO.vercel.app/`

Para voltar diretamente à interface sem iniciar a apresentação:

`https://SEU-DOMINIO.vercel.app/?interactive=1`
