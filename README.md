# Totem Coamo • GEPES — V3

Aplicação web para uso interno em totem de Recrutamento e Seleção.

## Principais recursos
- Modo apresentação automático em tela cheia
- Interface otimizada para touchscreen/1920×1080
- Retorno automático para apresentação após inatividade
- Vagas integradas ao Jobfeed da Selecty via `/api/vagas`
- Busca por cargo e filtro por cidade
- Área “Conheça a Coamo” com universos profissionais
- Sorteio integrado ao formulário existente
- Painel oculto de configurações: mantenha o logo pressionado por ~3 segundos
- Teste da integração de vagas dentro do painel oculto

## Integração Selecty
O frontend nunca recebe a chave da Selecty. O endpoint `/api/vagas.js` usa a variável de ambiente da Vercel.

### Variáveis na Vercel
- `SELECTY_PORTAL` = `coamo` (opcional nesta versão; `coamo` é o padrão)
- `SELECTY_JOBFEED_KEY` = chave do Jobfeed da Selecty

A V3 higieniza automaticamente espaços, aspas externas e quebras de linha na chave antes de enviá-la no header `X-Api-Key`. Isso evita o erro de header inválido quando a chave foi copiada com caracteres invisíveis.

Depois de alterar qualquer variável na Vercel, faça um novo **Redeploy**.

### Teste direto
Após publicar, acesse:
`https://totemcoamogepes.vercel.app/api/vagas?all=1&per_page=100`

Resultado esperado: JSON com `"ok": true` e a lista `vacancies`.

## Painel do totem
Mantenha o logo da Coamo pressionado por aproximadamente 3 segundos para abrir as configurações. O painel permite:
- alterar tempo de cada slide;
- alterar tempo de inatividade;
- exibir/ocultar Sorteio;
- ligar/desligar apresentação automática;
- testar a integração com a Selecty e visualizar o motivo de uma eventual falha.
