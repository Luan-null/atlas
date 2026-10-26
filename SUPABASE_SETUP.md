# Conectar o Atlas ao Supabase

O site usa o Supabase Auth para contas e a tabela `public.atlas_saves` para manter um save por conta. O navegador acessa o banco com a chave publicável; as políticas de Row Level Security (RLS) limitam cada conta ao próprio save.

## Preparar o projeto

1. No painel do Supabase, abra a configuração de URL da autenticação.
2. Defina a URL principal como `https://luan-null.github.io/atlas/`.
3. Adicione essa mesma URL à lista de redirecionamentos permitidos. Para testar localmente, adicione também o endereço exato que o Live Server mostrar, por exemplo `http://127.0.0.1:5500/**`.
4. Confirme que o provedor de e-mail está habilitado e que novos cadastros são permitidos.
5. Abra o **SQL Editor**, copie o conteúdo de `supabase/schema.sql` e execute.

Com a confirmação de e-mail habilitada, o cadastro envia um link para a pessoa confirmar o endereço. O link retorna à URL principal do Atlas. A configuração do redirecionamento precisa incluir a URL publicada e o endereço local usado no teste.

## Dados e segurança

- `user_id` identifica a conta do Supabase e é a chave do registro.
- `progress` guarda o estado do jogo como JSON; começa com `schemaVersion`, `currentMilestone` e `completedMilestones`.
- `created_at` e `updated_at` registram quando o save foi criado e alterado.
- As políticas permitem que uma pessoa leia, crie e atualize apenas o registro cujo `user_id` corresponde à sessão autenticada. A chave publicável não concede acesso a saves por conta própria.
- Nunca coloque uma chave `secret` ou `service_role` no site. O projeto usa apenas a chave publicável em `js/supabase-config.js`.

O mapa e o progresso jogável ainda não estão implementados. Quando essas telas existirem, o código poderá chamar `window.AtlasBackend.saveProgress(progresso)` para atualizar o save da conta atual.
