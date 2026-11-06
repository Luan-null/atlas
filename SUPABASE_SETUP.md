# Conectar o Atlas ao Supabase

O site usa o Supabase Auth para contas e a tabela `public.atlas_saves` para manter um save por conta. O navegador acessa o banco com a chave publicável; as políticas de Row Level Security (RLS) limitam cada conta ao próprio save.

## Preparar o projeto

1. No painel do Supabase, abra a configuração de URL da autenticação.
2. Defina a URL principal como `https://luan-null.github.io/atlas/`.
3. Adicione essa mesma URL à lista de redirecionamentos permitidos. Para testar localmente, adicione também o endereço exato que o Live Server mostrar, por exemplo `http://127.0.0.1:5500/**`.
4. Confirme que o provedor de e-mail está habilitado e que novos cadastros são permitidos.
5. Abra o **SQL Editor**, copie o conteúdo de `supabase/schema.sql` e execute.
6. Ainda no **SQL Editor**, execute `supabase/seed_games.sql` para criar o catálogo inicial e carregar os primeiros jogos. Se você já executou uma versão anterior desse arquivo, execute novamente: ele adiciona as colunas necessárias para metadados do IGDB sem apagar os jogos existentes.

Com a confirmação de e-mail habilitada, o cadastro envia um link para a pessoa confirmar o endereço. O link retorna à URL principal do Atlas. A configuração do redirecionamento precisa incluir a URL publicada e o endereço local usado no teste.

## Dados e segurança

- `user_id` identifica a conta do Supabase e é a chave do registro.
- `progress` guarda o estado do jogo como JSON; começa com `schemaVersion`, `currentMilestone` e `completedMilestones`.
- `progress.profile` guarda as seleções iniciais de jogos, os meios de acesso e a permissão para considerar rejogos. Essas respostas pertencem à conta e não ficam no catálogo público.
- `public.atlas_games` guarda o catálogo compartilhado. Contas autenticadas podem ler os dados; somente o proprietário do save pode ler ou alterar o próprio `atlas_saves`.
- `created_at` e `updated_at` registram quando o save foi criado e alterado.
- As políticas permitem que uma pessoa leia, crie e atualize apenas o registro cujo `user_id` corresponde à sessão autenticada. A chave publicável não concede acesso a saves por conta própria.
- Nunca coloque uma chave `secret` ou `service_role` no site. O projeto usa apenas a chave publicável em `js/supabase-config.js`.

O catálogo inicial inclui jogos citados na conversa e algumas opções para explorar estilos diferentes. A primeira recomendação usa regras simples de franquia, gêneros, mecânicas, acesso disponível e permissão para rejogar. Ela não usa aprendizado de máquina; os sinais ficam salvos para melhorar as regras conforme a Jornada evoluir.

## Busca de jogos no IGDB

A tela de perfil pesquisa no catálogo do IGDB e só importa um jogo para `atlas_games` quando você clica em **Adicionar ao Atlas**. Os dados escolhidos ficam armazenados no catálogo compartilhado; a chave privada da Twitch e a chave administrativa do Supabase ficam no servidor.

Ao abrir a etapa de jogos do perfil, o Atlas carrega em segundo plano as capas que faltam nos jogos iniciais e salva os endereços encontrados na coluna `cover_url` do catálogo. **Tentar capas ausentes** permite repetir a busca manualmente. A correspondência ignora diferenças como acentos, artigos e a palavra “Version”; para Minecraft, consulta diretamente a entrada oficial `Minecraft: Java Edition` do IGDB (ID 121), evitando resultados ambíguos. Nos outros jogos, o ano deve coincidir ou diferir por no máximo um ano, sem ambiguidade. Jogos sem correspondência segura continuam sem capa.

Publicar o site no GitHub Pages atualiza o front-end, mas não publica nem executa a Edge Function do Supabase. Para carregar as capas automaticamente, publique também a versão atual de `igdb-catalog`. Depois da primeira busca, as URLs ficam no catálogo do banco e aparecem também para outras contas.

Para remover os avisos falsos do `index.ts` no VS Code, instale a extensão recomendada **Deno** quando o VS Code solicitar. A configuração deste repositório ativa o suporte Deno somente em `supabase/functions`, mantendo o verificador JavaScript/TypeScript normal no restante do site. Depois da instalação, recarregue a janela do VS Code.

### Credenciais do IGDB

1. No [Twitch Developer Portal](https://dev.twitch.tv/console/apps), crie um aplicativo do tipo **Confidential** e selecione **Website Integration** como categoria. No campo de redirecionamento OAuth, use `https://luan-null.github.io/atlas/` e clique em **Adicionar**. O console atual exige um endereço HTTPS; esta integração usa credenciais de aplicativo, então o endereço não participa do fluxo de autenticação do IGDB.
2. Copie o **Client ID** e gere um **Client Secret**.
3. No painel do Supabase, abra **Edge Functions → Secrets** e adicione estes dois nomes e valores:
   - `IGDB_CLIENT_ID` — Client ID do aplicativo Twitch.
   - `IGDB_CLIENT_SECRET` — Client Secret do aplicativo Twitch.
4. Não coloque o Client Secret no JavaScript, no GitHub ou em mensagens. A função lê as credenciais somente no servidor.

### Publicar a função

O projeto contém `supabase/functions/igdb-catalog/index.ts`. Instale o [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) e, no terminal do VS Code aberto na pasta do Atlas, publique a função:

```powershell
supabase login
supabase link --project-ref dnxmuakguixzzdaxeafl
supabase functions deploy igdb-catalog
```

O `verify_jwt` permanece ativado. A função também usa o wrapper `@supabase/server` com `auth: 'user'`, que valida a sessão, administra o CORS e fornece acesso administrativo apenas dentro da função. A chave privilegiada nunca vai para o navegador. A configuração está em `supabase/config.toml`.

Se preferir publicar pelo painel, abra **Edge Functions → Deploy a new function → Via Editor**, use o nome `igdb-catalog`, substitua o código de exemplo pelo conteúdo completo de `supabase/functions/igdb-catalog/index.ts` e publique. Mantenha a verificação JWT ativada.

Depois de executar novamente `supabase/seed_games.sql`, configurar os dois secrets e publicar a função, entre em **Seu save**, digite um título no campo de busca e clique em **Buscar também no catálogo do IGDB**. Os resultados são limitados a dez por busca; escolha quais deseja adicionar. As capas ausentes dos jogos iniciais são carregadas quando a etapa de jogos do perfil é aberta.

O uso atual é para o protótipo pessoal. A documentação do IGDB informa que aplicações comerciais precisam entrar em contato para uma parceria comercial.
