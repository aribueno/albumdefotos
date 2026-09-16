# Álbum de Fotos — Design

Data: 2026-09-16

## Objetivo

Site web para armazenar fotos organizadas em álbuns, acessível pela internet, para uso do usuário e de familiares/amigos de confiança. Funcionalidades principais: criar álbuns, adicionar fotos, excluir fotos/álbuns e visualizar fotos em tamanho ampliado.

## Escopo

- Múltiplos álbuns, cada um com suas próprias fotos.
- Upload de fotos (uma ou várias por vez).
- Exclusão de fotos e de álbuns inteiros (com confirmação).
- Visualização ampliada (lightbox) com navegação entre fotos do álbum.
- Acesso protegido por uma única senha compartilhada (sem contas individuais).

Fora de escopo (v1): contas de usuário individuais, permissões por pessoa, compartilhamento seletivo de álbuns, edição de fotos, comentários/curtidas, testes automatizados.

## Arquitetura e stack

- **Next.js (App Router)** — projeto único, frontend e backend juntos via Route Handlers.
- **Neon (Postgres)** — banco de dados gerenciado (free tier) para metadados de álbuns e fotos.
- **Vercel Blob** — armazenamento dos arquivos de imagem.
- **Vercel** — hospedagem e deploy.
- **Next/Image** — redimensionamento e otimização automática das imagens na exibição (grade e visualização ampliada), sem necessidade de gerar thumbnails manualmente no upload.

Justificativa: stack única e bem documentada, free tier suficiente para uso familiar, sem servidor separado para manter.

## Modelo de dados (Postgres)

```
albums
  id          serial primary key
  name        text not null
  created_at  timestamptz not null default now()

photos
  id          serial primary key
  album_id    integer not null references albums(id) on delete cascade
  blob_url    text not null
  filename    text not null
  created_at  timestamptz not null default now()
```

## Autenticação

- Página `/login` com campo de senha única.
- A senha correta fica em uma variável de ambiente no Vercel (nunca no código-fonte).
- Ao validar a senha, o servidor define um cookie `httpOnly` assinado (sessão simples, sem tabela de usuários).
- `middleware.ts` verifica esse cookie em todas as rotas exceto `/login`, redirecionando para lá quando ausente/inválido.
- Toda rota de API que altera dados (criar álbum, upload, excluir) valida a sessão no servidor, independentemente da UI.

## Páginas e funcionalidades

- **`/login`** — formulário de senha.
- **`/` (Álbuns)** — grade com todos os álbuns (capa = primeira foto do álbum, ou placeholder se vazio). Botão "Novo álbum" (nome apenas). Cada álbum tem opção de excluir, com confirmação — apaga o álbum e todas as suas fotos (banco + Blob).
- **`/albuns/[id]`** — grade de fotos do álbum. Botão "Adicionar fotos" (seleção múltipla de arquivos, upload direto ao Blob + registro no banco). Cada foto tem botão de excluir, com confirmação (remove do Blob e do banco).
- **Visualização ampliada (lightbox)** — clicar numa foto abre modal em tela cheia com a imagem ampliada e setas para navegar entre as fotos do álbum (anterior/próxima); fecha com X ou tecla Esc.

## API (Route Handlers)

| Rota | Método | Descrição |
|---|---|---|
| `/api/login` | POST | Valida senha, define cookie de sessão |
| `/api/albums` | GET | Lista álbuns |
| `/api/albums` | POST | Cria álbum |
| `/api/albums/[id]` | DELETE | Exclui álbum e suas fotos (cascata) |
| `/api/albums/[id]/photos` | POST | Upload de fotos para o álbum |
| `/api/photos/[id]` | DELETE | Exclui uma foto |

Todas as rotas acima (exceto `/api/login`) exigem cookie de sessão válido.

## Validações e tratamento de erros

- Upload aceita apenas `image/jpeg`, `image/png`, `image/webp`, `image/gif`; limite de 10MB por arquivo. Arquivo inválido é rejeitado com mensagem clara, sem interromper o restante do lote.
- Exclusão de álbum ou foto sempre exige confirmação explícita do usuário (ação irreversível).
- Falhas de rede/servidor exibem mensagem amigável na interface (ex.: "Não foi possível enviar a foto, tente novamente") em vez de travar a tela.

## Testes

Dado o porte pessoal/familiar do projeto, a verificação será manual pelo navegador nos fluxos principais: login, criar/excluir álbum, upload/exclusão de foto, visualização ampliada com navegação. Sem suíte automatizada de testes na v1 — pode ser adicionada depois, se necessário.
