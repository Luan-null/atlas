# Projeto Atlas

Projeto pessoal para explorar a história dos videogames. O repositório contém o protótipo atual da tela de entrada e os materiais visuais usados no desenvolvimento.

## Estado atual

- A tela inicial mostra um vídeo em loop sem áudio. Se o vídeo não puder tocar, aparece a imagem estática de apoio.
- O wordmark Atlas e o botão **INICIAR** aparecem em sequência sobre a cena.
- A música de fundo tenta iniciar junto com a página. Como navegadores podem bloquear áudio automático, o controle de alto-falante permite ativar ou desativar a trilha.
- O botão **INICIAR** abre a tela de login sem recarregar a página.
- A transição entre abertura e login usa o efeito de papel em `assets/audio/paper.mp3`, com uma passagem visual curta.
- A tela de acesso permite criar conta e entrar com e-mail e senha pelo Supabase Auth.
- Depois de entrar, o Atlas cria ou carrega um save vinculado à conta. A estrutura do banco e as regras de acesso ficam em `supabase/schema.sql`; siga `SUPABASE_SETUP.md` para ativá-las no projeto Supabase.
- A tela seguinte e o progresso jogável ainda estão em desenvolvimento; a função de gravação já está disponível para as próximas etapas.
- A abertura e o login aparecem em janelas com pelo menos 1024 × 600 px; em telas menores, o Atlas mostra um aviso de acesso pelo computador. O bloqueio usa as dimensões da janela, não identifica o tipo de dispositivo.
- As transições respeitam a preferência do sistema por movimento reduzido e ficam recortadas dentro da janela para evitar barras de rolagem.
- A cena do Blender é um estudo separado de composição e iluminação, não é necessária para abrir a página.

## Tecnologias

- HTML, CSS e JavaScript sem framework ou etapa de compilação.
- Blender para o estudo de cena 3D.
- Fontes DM Sans e Marcellus carregadas do Google Fonts, com fontes locais alternativas.

Não é necessário instalar Node.js ou dependências locais. O SDK do Supabase é carregado por CDN, então a conexão de conta precisa de internet.

## Como abrir

Para testar cadastro, login e confirmação por e-mail, use o endereço publicado ou um servidor local, como Live Server. O endereço local também precisa estar na lista de redirecionamentos permitidos do Supabase. A abertura por `file://` não atende a esse fluxo.

Se a música não começar automaticamente, clique no controle de alto-falante no canto superior direito.

## Estrutura

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── supabase/
│   └── schema.sql
├── SUPABASE_SETUP.md
├── assets/
│   ├── audio/
│   ├── img/
│   └── video/
└── blender/
```

- `index.html` — página e carregamento dos estilos e scripts.
- `css/style.css` — aparência, animações e regras responsivas das telas de entrada e login.
- `js/app.js` — navegação entre entrada e login, autenticação, vídeo, música e efeitos da tela inicial.
- `js/supabase-config.js` e `js/supabase-client.js` — configuração publicável e integração com Auth e saves.
- `supabase/schema.sql` — tabela de save e políticas RLS que isolam os dados de cada conta.
- `SUPABASE_SETUP.md` — instruções para configurar redirecionamentos e aplicar o schema no painel.
- `assets/video/loop.mp4` — vídeo usado como fundo animado.
- `assets/video/atlas title game.mp4` — vídeo de abertura mantido como material do projeto; ainda não é usado na tela atual.
- `assets/img/atlas-title-scene.png` — imagem de apoio quando o vídeo não toca.
- `assets/img/atlas-social-preview.jpg` — imagem 1200 × 630 usada na prévia de compartilhamento.
- `assets/img/logo.png` — wordmark Atlas.
- `assets/img/favicon.png` — ícone da página.
- `assets/img/atlas-map.svg` — estudo vetorial anterior do mapa.
- `assets/audio/Atlas Title Game (Extended Seamless Loop).mp3` — trilha de fundo.
- `assets/audio/paper.mp3` — efeito de papel ao iniciar e abrir o login.

## Cena de estudo no Blender

A pasta `blender/` contém uma cena separada para estudar a composição em perspectiva:

- `atlas_blockout.blend` — arquivo da cena para abrir no Blender.
- `atlas_blockout.py` — script comentado que monta objetos, materiais, câmera e luzes.
- `atlas_blockout_preview.png` — prévia renderizada da cena-base.

O blockout serve para estudar ângulo, escala e iluminação. A imagem de referência usada na tela de entrada fica em `assets/img/atlas-title-scene.png`.
