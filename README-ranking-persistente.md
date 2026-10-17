# Ranking persistente — preparado, ainda NÃO ativado

Este pacote é um recurso **opt-in**. Nada é enviado para Neon enquanto
`RANKING_ENABLED` não estiver definido como `1` no ambiente de implantação.
**Não ativar ou mesclar durante o uso do totem no evento.** A ramificação de
preparação não altera `main`, `jogos.html`, o modo apresentação ou o site em uso.

## O que já está implementado

- Rankings **Top 5 por jogo**, com a mesma regra de desempate anterior: pontos,
  tempo, precisão, fase, horário mais antigo.
- Banco Postgres Neon via API da Vercel. Telefones nunca saem na API pública.
- Fila IndexedDB com cópia localStorage, que tenta sincronizar na abertura,
  reconexão, foco e periodicamente. O resultado local permanece no navegador.
- Envio idempotente por `submission_id` para impedir duplicidade após retry.
- Geração global e geração por jogo: reset total e individual invalidam filas
  offline antigas, sem fazer pontuações zeradas reaparecerem.
- Painel escondido dos cinco toques: visualizar contatos com senha, backup JSON,
  importar placares locais ou arquivo, zerar jogo e **ZERAR TODOS**.
- Limpeza exige senha do servidor quando sincronizado, frase exata e confirmação
  dupla em até sete segundos. Sem sincronização, a limpeza afeta só este navegador.

## O que falta, conscientemente, antes de ligar

1. Escolher/criar um projeto Neon Postgres e executar **`db/ranking-schema.sql`**
   no editor SQL do Neon. A preparação não criou banco nem executou migrações.
2. Configurar **somente no ambiente de teste/preview** as variáveis:
   - `DATABASE_URL`: conexão privada do Neon.
   - `RANKING_ADMIN_SECRET`: senha aleatória longa (mínimo de 20 caracteres).
   - `RANKING_ENABLED=1`: **apenas para testar o preview quando autorizado**.
3. Testar pelo menos dois navegadores e simular perda de internet, envio offline,
   reinício do totem, retorno da conexão, troca do Top 5, reset de um jogo e reset
   de todos. Verificar no Neon a persistência dos registros.
4. Agendar migração **após o uso do totem**, nunca no meio da operação. Fazer
   backup do ranking real **na origem do site de produção**, pois o localStorage
   de um preview GitHub/Vercel é isolado do domínio do totem.
5. Em janela controlada, implantar com `RANKING_ENABLED=0`, atualizar no totem,
   abrir painel escondido e clicar **Baixar backup local**. Conferir arquivo JSON.
6. Ativar backend com variáveis verificadas, importar o JSON no painel escondido
   (senha + frase `IMPORTAR` + duplo toque), confirmar todos os Top 5. Só depois
   liberar para o público com os rankings sincronizados.

## Operação posterior

**Abrir painel:** cinco toques rápidos (até quatro segundos) no título do ranking.
No jogo principal, cada aba usa a modalidade correspondente ao título.

**Zerar todos:** entrar no painel, informar a senha (modo sincronizado), escrever
`ZERAR TODOS`, tocar em **Zerar TODOS os rankings** e tocar novamente em até
sete segundos. O servidor incrementa a geração global, apagando imediatamente
da visão os nove Top 5. Os dados antigos ficam arquivados no banco para eventual
auditoria; não voltam por sincronização atrasada. O backup JSON continua disponível
se previamente baixado. Para excluir fisicamente históricos e telefones, aplicar
política de retenção e limpeza administrativa do Postgres.

**Zerar só um jogo:** frase `ZERAR JOGO`, botão individual, confirmação dupla,
senha se sincronizado. Outras modalidades e suas filas são preservadas.

**Sem internet:** dados já recebidos permanecem no Neon; pontuações novas ficam
no armazenamento local até conexão. Recarregar/desligar o equipamento não apaga
IndexedDB/localStorage normalmente, mas limpar dados do site, navegação anônima,
falha total do armazenamento ou formatação do dispositivo pode apagá-los antes
do envio. Uma pontuação offline anterior a um reset será descartada após reconexão.

**Atenção à privacidade:** nomes e telefones são dados pessoais; restringir a
senha, controlar acesso ao Neon, definir prazo de retenção e aviso de privacidade.
A API recebe pontuações do navegador; se houver premiação de alto valor, validar
resultados com auditoria/regras antifraude adicionais antes da ativação.

## Arquivos desta preparação

- `api/rankings.js` — API pública/admin, bloqueada por `RANKING_ENABLED`.
- `lib/ranking-core.mjs` — validações e regras de desempate testáveis.
- `db/ranking-schema.sql` — tabelas e índices do Neon.
- `ranking-cloud.v1.js` — fila offline, backup e sincronização no navegador.
- `ranking.v55.js` — integração opcional com ranking e botão escondido.
- Cinco páginas de jogos usam a nova integração com versão de cache atualizada.
- `tests/ranking.test.mjs` — testes automáticos; rodar `npm run test:ranking`.

Não se deve cadastrar `DATABASE_URL`, senha administrativa ou tokens em Git.
