# Totem Coamo · GEPES

Site do totem de Recrutamento e Seleção da Coamo: apresentação institucional, vagas
(integradas à Selecty), sorteio e a área de jogos **Coamo Games**, com os mascotes
Toninho e Aroldinho (os mascotes aparecem só no Coamo Games). Publicado na Vercel.

## Páginas

| Página | O que é |
| --- | --- |
| `index.html` | Início do totem e modo apresentação automática |
| `vagas.html` | Vagas da Selecty (via `api/vagas.js`) |
| `apresentacao.html` | Conheça a Coamo |
| `sorteio.html` | Vídeo + cadastro do sorteio |
| `jogos.html` | Menu do Coamo Games |
| `jogo-area.html` · `jogo-memoria.html` · `jogo-cadeia.html` · `jogo-classificacao.html` · `jogo-silo.html` | Jogos |
| `mapa.html`, `jogo-fazenda.html`, `jogo-missao.html` | Redirecionamentos de endereços antigos |

## Arquivos de código

| Arquivo | Usado em | Função |
| --- | --- | --- |
| `styles.v42.css` · `app.v42.js` | Início, Vagas, Conheça, Sorteio | Estilos e lógica do totem |
| `styles.v48.css` (importa `styles.v47.css`) · `app.v59.js` | Jogos | Estilos e lógica dos jogos |
| `silo.v59.js` · `ranking.v55.js` | Silo / Classificação | Jogo do silo e ranking |
| `site.v61.css` · `site.v61.js` | Todas | Ajustes gerais: menu no celular, Início do totem, Sorteio, modo apresentação no totem |
| `mascotes.v59.js` / `.css` | Jogos | Mascotes articulados, falas e reações |
| `mascotes-falas.v59.js` | Jogos | **Falas dos mascotes — edite aqui** |
| `mascotes-banners.v60.js` | Jogos | Banners vetoriais dos jogos |
| `mascotes-rigs.v58.js` | Jogos | Partes dos bonecos (gerado, não editar) |
| `pwa.v55.js` · `service-worker.js` · `manifest.webmanifest` | Todas | Modo app / tela cheia do totem |

O número no nome (`v42`, `v59`…) serve para o navegador do totem baixar a versão nova.
Ao alterar um arquivo, mantenha o nome e mude o `?v=` nas páginas, ou crie a próxima versão
e atualize as páginas — e apague a anterior. O histórico completo fica no Git.

## Painel oculto

Mantenha pressionado o logo da Coamo por cerca de 3 segundos para abrir o painel:
tempo dos slides, retorno por inatividade, sorteio, apresentação automática, conteúdos
(Programa de Estágio, Unicoamo, Qualidade de Vida, Coamo + Saúde, FUPS, ARCAM) e teste da
integração de vagas. As preferências ficam salvas no navegador do próprio totem.

## Mascotes

- Falas: `mascotes-falas.v59.js` (`["t", "..."]` = Toninho, `["a", "..."]` = Aroldinho).
- O rosto é sempre o desenho original; as expressões vêm do corpo (cabeça, braços, piscar).
- Para desligar os mascotes animados, remova as linhas `mascotes*` das páginas: as imagens
  originais voltam a aparecer.

## Marca Coamo Games

`assets/coamo-games/` — logo completa e mini, em SVG (site) e PNG (outros materiais).

## Imagens

Ao adicionar fotos, prefira JPG ou WebP com até 1600 px de largura. Fotos maiores deixam
o totem lento sem ganho visível.
