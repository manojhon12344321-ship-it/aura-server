<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:69d8b55bea5551151fd47ec4a82947b9e6436aeab9734b03984bd2b2ec5555c2 -->

# DIVINOS GAMES

E-commerce gamer em Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui (Radix), Supabase, Zustand, Zod, React Hook Form, Embla e Recharts.

## Iniciar

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000. Sem as duas variáveis Supabase, a loja funciona automaticamente com 12 produtos demonstrativos e persistência no navegador. Login demonstrativo aceita e-mail fictício e senha de pelo menos seis caracteres. Não use dados pessoais reais. `/admin` é um painel local aberto apenas neste modo demonstrativo; `/cliente` exige login demonstrativo.

O arquivo original `server.js` foi preservado. Para iniciar o serviço AURA anterior, use `npm run aura` em outra porta com sua configuração original.

## Supabase

1. Crie um projeto Supabase vazio e execute `supabase/schema.sql` no SQL Editor uma única vez. Inclui tabelas, índices, RLS, funções transacionais, trigger de perfis, buckets e seed.
2. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`. Nunca exponha a chave service role.
3. Em Authentication, configure Site URL e Redirect URLs, incluindo `http://localhost:3000/auth/callback` e o callback do domínio publicado.
4. Ative Google OAuth e configure as credenciais e callback fornecidos pelo Supabase no Google Cloud. Habilite confirmação por e-mail conforme o ambiente.
5. O primeiro usuário registrado recebe `admin`; os seguintes recebem `client`. Crie a primeira conta antes de divulgar a loja.
6. Reinicie a aplicação após alterar as variáveis.

As páginas protegidas usam `auth.getUser()` no middleware e verificam `profiles.role`. As políticas RLS fazem a autorização no banco; o cliente não pode alterar seu papel, preços de pedidos, totais nem estoque por checkout direto. As imagens dos produtos são públicas; somente administradores podem enviá-las. Avatares ficam na pasta do usuário.

## Fluxos

- `/`: quatro banners Embla com autoplay, categorias, carrosséis, ofertas e coleção.
- `/catalogo`: filtro por categoria e ordenação de preço.
- `/produto/[slug]`: galeria, zoom, thumbnails, fullscreen, teclado, swipe, estoque, frete e avaliações moderadas.
- `/carrinho` e `/checkout`: quantidades, cupons e três etapas de compra.
- `/login`, `/cadastro`, `/auth/callback`: e-mail/senha e Google via Supabase.
- `/cliente`: dashboard, pedidos, timeline, favoritos e perfil com avatar.
- `/admin`: vendas, estoque, gráfico, CRUD de produtos/categorias/cupons, pedidos, clientes, avaliações e configurações.

No cadastro de produtos, envie vários arquivos JPG/PNG/WebP de até 5 MB, arraste previews para ordenar e use a estrela para definir a imagem principal. A ordem é gravada no JSON `images`.

## Pagamento e dados de demonstração

**Pix e cartão são simulações**, inclusive com Supabase configurado. Não há cobrança, gateway ou QR Pix válido. A função `checkout` cria um pedido pendente, confirma o pagamento demonstrativo e baixa estoque na mesma transação. Bloqueia linhas de produtos e cupom, recalcula os valores no servidor e rejeita estoque insuficiente. Para vendas reais, substitua a confirmação simulada por um webhook autenticado de um provedor de pagamentos, com idempotência e conciliação.

O frete é uma simulação de prazo e tarifa fixa de R$ 24,90, com limite de gratuidade configurável. Não integra transportadoras. As imagens locais são ilustrativas (Unsplash); o seed SQL usa cinco imagens Picsum por produto conforme solicitado. Substitua por fotografias corretas e autorizadas antes de publicar. Newsletter salva inscrições apenas no navegador; não envia e-mail. A persistência demonstrativa não é compartilhada entre navegadores. Para reiniciar a demo, remova as chaves `divinos-*` do armazenamento local.

<!-- coderabbit-ai-generated:v1 -->

<!-- coderabbit-ai-generated-section:v1:aed676ad98d270fccab30c2cc6ad7f60619feb6f3f4fc6ba61fe833de2a8b29f -->

## Segurança de dependências

A auditoria final `npm audit` aponta **1 vulnerabilidade crítica no pacote Next.js 14**. Esta versão foi mantida por ser um requisito explícito da tarefa. Zod, resolvers e PostCSS foram atualizados e as dependências transitivas desnecessárias do CLI foram removidas. A aplicação pode ser demonstrada localmente, mas a publicação para vendas reais exige migrar para uma versão corrigida do Next.js e repetir a validação. O aviso do npm não foi suprimido.

## Validação

<!-- /coderabbit-ai-generated:v1 -->

```bash
npm run typecheck
npm run build
npm start
```

Os testes PostgreSQL em `tests/bootstrap.sql` e `tests/schema.integration.sql` usam contratos mínimos de Auth/Storage para um banco PostgreSQL 16 descartável. Execute bootstrap, schema e testes nessa ordem, com `psql -v ON_ERROR_STOP=1`. **Não execute o bootstrap ou os testes em um projeto Supabase real.** Eles criam usuários fictícios e alteram dados.

Foram exercitados seed, atribuição de papéis, privilégios de perfil, total com desconto, estoque, rollback e isolamento de pedidos. A interface foi exercitada no Chromium compartilhado do Preview. OAuth, entrega de e-mail e Storage hospedado precisam ser verificados no projeto Supabase configurado.


<!-- /coderabbit-ai-generated:v1 -->