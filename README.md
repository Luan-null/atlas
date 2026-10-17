# Projeto Atlas

Projeto pessoal para explorar a história dos videogames. O repositório contém o protótipo atual da tela de entrada e os materiais visuais usados no desenvolvimento.

## Estado atual

- A tela inicial mostra um vídeo em loop sem áudio. Se o vídeo não puder tocar, aparece a imagem estática de apoio.
- O wordmark Atlas e o botão **INICIAR** aparecem em sequência sobre a cena.
- A música de fundo tenta iniciar junto com a página. Como navegadores podem bloquear áudio automático, o controle de alto-falante permite ativar ou desativar a trilha.
- O botão **INICIAR** ainda não abre outra tela; por enquanto, ele toca um efeito sonoro.
- A página se adapta a telas menores e respeita a preferência do sistema por movimento reduzido.
- A cena do Blender é um estudo separado de composição e iluminação, não é necessária para abrir a página.

## Tecnologias

- HTML, CSS e JavaScript sem framework ou etapa de compilação.
- Blender para o estudo de cena 3D.
- Fontes DM Sans e Marcellus carregadas do Google Fonts, com fontes locais alternativas.

Não é necessário instalar Node.js ou dependências para visualizar a tela atual.

## Como abrir

Abra `index.html` em um navegador. No VS Code, também é possível abrir a pasta do projeto e usar uma extensão de servidor local, como Live Server, para abrir a página em um endereço local.

Se a música não começar automaticamente, clique no controle de alto-falante no canto superior direito.

## Estrutura

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── assets/
│   ├── audio/
│   ├── img/
│   └── video/
└── blender/
```

- `index.html` — página e carregamento dos estilos e scripts.
- `css/style.css` — aparência, animações e regras responsivas da tela inicial.
- `js/app.js` — vídeo, música, controles e efeitos da tela inicial.
- `assets/video/loop.mp4` — vídeo usado como fundo animado.
- `assets/video/atlas title game.mp4` — vídeo de abertura mantido como material do projeto; ainda não é usado na tela atual.
- `assets/img/atlas-title-scene.png` — imagem de apoio quando o vídeo não toca.
- `assets/img/atlas-social-preview.jpg` — imagem 1200 × 630 usada na prévia de compartilhamento.
- `assets/img/logo.png` — wordmark Atlas.
- `assets/img/favicon.png` — ícone da página.
- `assets/img/atlas-map.svg` — estudo vetorial anterior do mapa.
- `assets/audio/Atlas Title Game (Extended Seamless Loop).mp3` — trilha de fundo.

## Cena de estudo no Blender

A pasta `blender/` contém uma cena separada para estudar a composição em perspectiva:

- `atlas_blockout.blend` — arquivo da cena para abrir no Blender.
- `atlas_blockout.py` — script comentado que monta objetos, materiais, câmera e luzes.
- `atlas_blockout_preview.png` — prévia renderizada da cena-base.

O blockout serve para estudar ângulo, escala e iluminação. A imagem de referência usada na tela de entrada fica em `assets/img/atlas-title-scene.png`.
