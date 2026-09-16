# Álbum de Fotos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um site em Next.js para armazenar fotos em múltiplos álbuns, com upload, exclusão e visualização ampliada, protegido por senha compartilhada, hospedado na Vercel.

**Architecture:** Aplicação Next.js (App Router) full-stack: páginas React no frontend, Route Handlers para a API, Postgres (Neon) para metadados de álbuns/fotos, Vercel Blob para os arquivos de imagem, e um cookie de sessão assinado (JWT via `jose`) validado em `middleware.ts` para proteger todo o site com uma senha única.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, `@neondatabase/serverless`, `@vercel/blob`, `jose`, deploy na Vercel.

> **Nota sobre verificação:** conforme decidido no spec ([docs/superpowers/specs/2026-09-16-album-de-fotos-design.md](../specs/2026-09-16-album-de-fotos-design.md)), este projeto não usa suíte de testes automatizados (uso pessoal/familiar). Cada tarefa abaixo tem uma seção **Verificar** com comandos `curl` (para API) ou passos manuais no navegador (para UI), com o resultado esperado explícito, no lugar de testes automatizados.
>
> Comandos de shell abaixo usam sintaxe Bash (funcionam no Git Bash no Windows). Rode `npm run dev` num terminal e deixe rodando; execute os comandos de verificação em outro terminal.

---

### Task 1: Scaffolding base do projeto Next.js

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `next.config.js`
- Create: `next-env.d.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx` (placeholder, substituído na Task 7)

- [ ] **Step 1: Criar `package.json`**

```json
{
  "name": "album-de-fotos",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "@vercel/blob": "^0.27.1",
    "jose": "^5.9.6",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "typescript": "^5.7.2"
  }
}
```

- [ ] **Step 2: Criar `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Criar `.gitignore`**

```
node_modules
.next
.env.local
.vercel
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 4: Criar `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

- [ ] **Step 5: Criar `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 6: Criar `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Álbum de Fotos',
  description: 'Álbum de fotos da família',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Criar `app/globals.css`**

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #fafafa;
  color: #1a1a1a;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  cursor: pointer;
  font-family: inherit;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: #fff;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
```

- [ ] **Step 8: Criar `app/page.tsx` (placeholder temporário)**

```tsx
export default function AlbumsPage() {
  return <main style={{ padding: 24 }}>Álbum de Fotos</main>;
}
```

- [ ] **Step 9: Instalar dependências**

Run: `npm install`
Expected: instala sem erros, cria `node_modules/` e `package-lock.json`.

- [ ] **Step 10: Verificar que o servidor de desenvolvimento sobe**

Run: `npm run dev`
Expected: log mostra `Ready` e serve em `http://localhost:3000`. Abra no navegador e confirme que aparece o texto "Álbum de Fotos". Pare o servidor com Ctrl+C depois de confirmar.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore next.config.js next-env.d.ts app/layout.tsx app/globals.css app/page.tsx
git commit -m "chore: scaffold Next.js project"
```

---

### Task 2: Contas externas e variáveis de ambiente

Esta tarefa não tem código — são passos manuais para criar as contas/serviços gratuitos necessários e configurar as variáveis de ambiente locais.

**Files:**
- Create: `.env.local.example`
- Create (local, não versionado): `.env.local`

- [ ] **Step 1: Criar conta na Vercel**

Acesse `https://vercel.com/signup` e crie uma conta gratuita (pode usar GitHub para login).

- [ ] **Step 2: Criar um projeto Neon (Postgres) pela Vercel**

No dashboard da Vercel, vá em **Storage → Create Database → Neon** (ou acesse `https://neon.tech` diretamente e crie um projeto gratuito). Depois de criado, copie a connection string (formato `postgresql://usuario:senha@host/banco?sslmode=require`).

- [ ] **Step 3: Criar um Vercel Blob store**

No dashboard da Vercel, vá em **Storage → Create Database → Blob**. Depois de criado, copie o token `BLOB_READ_WRITE_TOKEN` (aparece na aba `.env.local` do store).

- [ ] **Step 4: Criar `.env.local.example`**

```
# Senha compartilhada para acessar o site
SITE_PASSWORD=troque-por-uma-senha-forte

# Segredo usado para assinar o cookie de sessão (string aleatória longa)
SESSION_SECRET=troque-por-uma-string-aleatoria-longa

# Connection string do Neon (Storage > seu banco > Connection string na Vercel)
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require

# Token do Vercel Blob (Storage > seu blob store > .env.local na Vercel)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx
```

- [ ] **Step 5: Criar `.env.local` (não versionado) com valores reais**

Copie `.env.local.example` para `.env.local` e preencha com os valores reais obtidos nos passos 2 e 3, escolhendo você mesmo uma senha (`SITE_PASSWORD`) e gerando um segredo aleatório para `SESSION_SECRET`.

Run (para gerar um `SESSION_SECRET` aleatório): `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
Expected: imprime uma string hexadecimal de 64 caracteres — copie e use como `SESSION_SECRET`.

- [ ] **Step 6: Verificar que `.env.local` não será versionado**

Run: `git status`
Expected: `.env.local` **não aparece** na lista de arquivos (está ignorado pelo `.gitignore` criado na Task 1).

- [ ] **Step 7: Commit**

```bash
git add .env.local.example
git commit -m "chore: add environment variable template"
```

---

### Task 3: Conexão com banco de dados e schema

**Files:**
- Create: `lib/db.ts`
- Create: `schema.sql`
- Create: `scripts/check-db.mjs`

- [ ] **Step 1: Criar `schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS albums (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  album_id INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] **Step 2: Criar `lib/db.ts`**

```ts
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada');
}

export const sql = neon(process.env.DATABASE_URL);
```

- [ ] **Step 3: Rodar o schema contra o banco Neon (via SQL Editor)**

Abra o dashboard do projeto Neon no navegador → aba **SQL Editor**. Cole o conteúdo de `schema.sql` e execute.
Expected: duas mensagens de sucesso, uma para cada `CREATE TABLE`, sem erros.

(Alternativa, se tiver `psql` instalado: `psql "$(grep DATABASE_URL .env.local | cut -d= -f2-)" -f schema.sql`)

- [ ] **Step 4: Criar `scripts/check-db.mjs` para verificar a conexão**

```js
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const tables = await sql`
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
`;

console.log(tables);
```

- [ ] **Step 5: Verificar que as tabelas foram criadas**

Run: `node --env-file=.env.local scripts/check-db.mjs`
Expected: imprime um array contendo `{ table_name: 'albums' }` e `{ table_name: 'photos' }` (ordem pode variar). Requer Node.js 20.6+ (a flag `--env-file` é estável no Node 22+; em versões 20.6–21.x pode aparecer um aviso experimental, o que é inofensivo).

- [ ] **Step 6: Commit**

```bash
git add lib/db.ts schema.sql scripts/check-db.mjs
git commit -m "feat: add database connection and schema"
```

---

### Task 4: Autenticação (helpers, API de login, middleware)

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/login/route.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Criar `lib/auth.ts`**

```ts
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'session';
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET não configurada');
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Criar `app/api/login/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, SESSION_DURATION_SECONDS, createSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });
  return response;
}
```

- [ ] **Step 3: Criar `middleware.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isValid = token ? await verifySessionToken(token) : false;

  if (isValid) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!login|api/login|_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 4: Verificar login com senha errada**

Run: `npm run dev` (deixe rodando em um terminal)

Em outro terminal:
Run: `curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d '{"password":"senha-errada"}'`
Expected: `401`

- [ ] **Step 5: Verificar login com senha correta e cookie de sessão**

Run: `curl -s -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d "{\"password\":\"$(grep SITE_PASSWORD .env.local | cut -d= -f2)\"}" -c /tmp/cookies.txt -w "\n%{http_code}\n"`
Expected: `{"ok":true}` seguido de `200`. O arquivo `/tmp/cookies.txt` deve conter uma linha com `session`.

- [ ] **Step 6: Verificar que rotas protegidas exigem sessão**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `307` (redirecionamento para `/login`, sem cookie)

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ -b /tmp/cookies.txt`
Expected: `200` (com o cookie válido)

- [ ] **Step 7: Commit**

```bash
git add lib/auth.ts app/api/login/route.ts middleware.ts
git commit -m "feat: add password-based session authentication"
```

---

### Task 5: Página de login

**Files:**
- Create: `app/login/page.tsx`

- [ ] **Step 1: Criar `app/login/page.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      setError('Senha incorreta. Tente novamente.');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: '0 16px' }}>
      <h1>Álbum de Fotos</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
          autoFocus
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 8 }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verificar no navegador**

Com `npm run dev` rodando, acesse `http://localhost:3000/` em uma aba anônima (sem cookie). Confirme que é redirecionado para `/login`. Digite uma senha errada e confirme a mensagem "Senha incorreta. Tente novamente.". Digite a senha correta (a que você definiu em `SITE_PASSWORD`) e confirme que é redirecionado para `/` mostrando o placeholder "Álbum de Fotos".

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add login page"
```

---

### Task 6: API de álbuns (listar, criar, buscar um, excluir)

**Files:**
- Create: `app/api/albums/route.ts`
- Create: `app/api/albums/[id]/route.ts`

- [ ] **Step 1: Criar `app/api/albums/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  const albums = await sql`
    SELECT
      albums.id,
      albums.name,
      albums.created_at,
      (
        SELECT photos.blob_url FROM photos
        WHERE photos.album_id = albums.id
        ORDER BY photos.created_at ASC
        LIMIT 1
      ) AS cover_url
    FROM albums
    ORDER BY albums.created_at DESC
  `;
  return NextResponse.json({ albums });
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Nome do álbum é obrigatório' }, { status: 400 });
  }

  const [album] = await sql`
    INSERT INTO albums (name) VALUES (${name.trim()})
    RETURNING id, name, created_at
  `;
  return NextResponse.json({ album }, { status: 201 });
}
```

- [ ] **Step 2: Criar `app/api/albums/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = Number(id);

  if (!Number.isInteger(albumId)) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const [album] = await sql`SELECT id, name, created_at FROM albums WHERE id = ${albumId}`;

  if (!album) {
    return NextResponse.json({ error: 'Álbum não encontrado' }, { status: 404 });
  }

  const photos = await sql`
    SELECT id, album_id, blob_url, filename, created_at
    FROM photos WHERE album_id = ${albumId}
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ album, photos });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = Number(id);

  if (!Number.isInteger(albumId)) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const photos = await sql`SELECT blob_url FROM photos WHERE album_id = ${albumId}`;

  await Promise.all(photos.map((photo) => del(photo.blob_url as string)));

  await sql`DELETE FROM albums WHERE id = ${albumId}`;

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verificar criação de álbum**

Com `npm run dev` rodando e o cookie válido em `/tmp/cookies.txt` (da Task 4):

Run: `curl -s -X POST http://localhost:3000/api/albums -b /tmp/cookies.txt -H "Content-Type: application/json" -d '{"name":"Viagem de teste"}' -w "\n%{http_code}\n"`
Expected: `201` e um JSON com `"album":{"id":1,"name":"Viagem de teste",...}`

- [ ] **Step 4: Verificar listagem de álbuns**

Run: `curl -s http://localhost:3000/api/albums -b /tmp/cookies.txt -w "\n%{http_code}\n"`
Expected: `200` e `"albums":[{"id":1,"name":"Viagem de teste",...,"cover_url":null}]`

- [ ] **Step 5: Verificar busca de um álbum**

Run: `curl -s http://localhost:3000/api/albums/1 -b /tmp/cookies.txt -w "\n%{http_code}\n"`
Expected: `200` e `"album":{"id":1,...},"photos":[]`

- [ ] **Step 6: Verificar validação de nome vazio**

Run: `curl -s -X POST http://localhost:3000/api/albums -b /tmp/cookies.txt -H "Content-Type: application/json" -d '{"name":""}' -w "\n%{http_code}\n"`
Expected: `400` e `{"error":"Nome do álbum é obrigatório"}`

- [ ] **Step 7: Commit**

```bash
git add app/api/albums/route.ts "app/api/albums/[id]/route.ts"
git commit -m "feat: add albums API (list, create, get, delete)"
```

---

### Task 7: Página inicial (grade de álbuns)

**Files:**
- Modify: `app/page.tsx` (substitui o placeholder da Task 1)

- [ ] **Step 1: Substituir `app/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Album = {
  id: number;
  name: string;
  created_at: string;
  cover_url: string | null;
};

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadAlbums() {
    setLoading(true);
    const response = await fetch('/api/albums');
    const data = await response.json();
    setAlbums(data.albums ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newName.trim()) return;

    const response = await fetch('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });

    if (!response.ok) {
      setError('Não foi possível criar o álbum. Tente novamente.');
      return;
    }

    setNewName('');
    setError(null);
    loadAlbums();
  }

  async function handleDelete(albumId: number) {
    if (!confirm('Excluir este álbum e todas as suas fotos? Essa ação não pode ser desfeita.')) {
      return;
    }

    const response = await fetch(`/api/albums/${albumId}`, { method: 'DELETE' });

    if (!response.ok) {
      setError('Não foi possível excluir o álbum. Tente novamente.');
      return;
    }

    loadAlbums();
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1>Meus Álbuns</h1>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Nome do novo álbum"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">Novo álbum</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Carregando...</p>
      ) : albums.length === 0 ? (
        <p>Nenhum álbum ainda. Crie o primeiro acima.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {albums.map((album) => (
            <div key={album.id} style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
              <Link href={`/albuns/${album.id}`}>
                <div style={{ position: 'relative', width: '100%', height: 160, background: '#f0f0f0' }}>
                  {album.cover_url && (
                    <Image src={album.cover_url} alt={album.name} fill style={{ objectFit: 'cover' }} />
                  )}
                </div>
                <p style={{ padding: 8, margin: 0 }}>{album.name}</p>
              </Link>
              <button onClick={() => handleDelete(album.id)} style={{ margin: 8 }}>
                Excluir álbum
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verificar no navegador**

Acesse `http://localhost:3000/` logado. Confirme que o álbum "Viagem de teste" (criado na Task 6) aparece na grade. Crie um novo álbum pelo formulário e confirme que aparece na lista sem recarregar a página manualmente. Exclua um álbum e confirme o diálogo de confirmação e o sumiço do álbum da grade.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add albums grid home page"
```

---

### Task 8: API de fotos (upload, excluir)

**Files:**
- Create: `app/api/albums/[id]/photos/route.ts`
- Create: `app/api/photos/[id]/route.ts`

- [ ] **Step 1: Criar `app/api/albums/[id]/photos/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { sql } from '@/lib/db';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const albumId = Number(id);

  if (!Number.isInteger(albumId)) {
    return NextResponse.json({ error: 'ID de álbum inválido' }, { status: 400 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const uploaded = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: tipo de arquivo não suportado`);
      continue;
    }
    if (file.size > MAX_SIZE_BYTES) {
      errors.push(`${file.name}: arquivo maior que 10MB`);
      continue;
    }

    const blob = await put(`albums/${albumId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });

    const [photo] = await sql`
      INSERT INTO photos (album_id, blob_url, filename)
      VALUES (${albumId}, ${blob.url}, ${file.name})
      RETURNING id, album_id, blob_url, filename, created_at
    `;
    uploaded.push(photo);
  }

  return NextResponse.json({ uploaded, errors }, { status: uploaded.length > 0 ? 201 : 400 });
}
```

- [ ] **Step 2: Criar `app/api/photos/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photoId = Number(id);

  if (!Number.isInteger(photoId)) {
    return NextResponse.json({ error: 'ID de foto inválido' }, { status: 400 });
  }

  const [photo] = await sql`SELECT blob_url FROM photos WHERE id = ${photoId}`;

  if (!photo) {
    return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
  }

  await del(photo.blob_url as string);
  await sql`DELETE FROM photos WHERE id = ${photoId}`;

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Criar uma imagem de teste válida**

Run: `echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=" | base64 -d > /tmp/test.png`
Expected: cria o arquivo `/tmp/test.png` (uma imagem PNG 1x1 válida).

- [ ] **Step 4: Verificar upload de foto**

(Use o ID de um álbum existente, criado na Task 6/7 — ajuste `1` abaixo se necessário.)

Run: `curl -s -X POST http://localhost:3000/api/albums/1/photos -b /tmp/cookies.txt -F "files=@/tmp/test.png;type=image/png" -w "\n%{http_code}\n"`
Expected: `201` e `"uploaded":[{"id":1,"album_id":1,"blob_url":"https://...public.blob.vercel-storage.com/...","filename":"test.png",...}],"errors":[]`

- [ ] **Step 5: Verificar rejeição de tipo de arquivo inválido**

Run: `echo "conteudo qualquer" > /tmp/test.txt && curl -s -X POST http://localhost:3000/api/albums/1/photos -b /tmp/cookies.txt -F "files=@/tmp/test.txt;type=text/plain" -w "\n%{http_code}\n"`
Expected: `400` e `"errors":["test.txt: tipo de arquivo não suportado"]`

- [ ] **Step 6: Verificar exclusão de foto**

Run: `curl -s -X DELETE http://localhost:3000/api/photos/1 -b /tmp/cookies.txt -w "\n%{http_code}\n"`
Expected: `200` e `{"ok":true}`

Run: `curl -s -X DELETE http://localhost:3000/api/photos/1 -b /tmp/cookies.txt -w "\n%{http_code}\n"` (excluir de novo)
Expected: `404` e `{"error":"Foto não encontrada"}`

- [ ] **Step 7: Commit**

```bash
git add "app/api/albums/[id]/photos/route.ts" "app/api/photos/[id]/route.ts"
git commit -m "feat: add photo upload and delete API"
```

---

### Task 9: Página de álbum (grade de fotos, upload, excluir)

**Files:**
- Create: `app/albuns/[id]/page.tsx`

- [ ] **Step 1: Criar `app/albuns/[id]/page.tsx`**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

type Photo = {
  id: number;
  album_id: number;
  blob_url: string;
  filename: string;
  created_at: string;
};

type Album = {
  id: number;
  name: string;
  created_at: string;
};

export default function AlbumDetailPage() {
  const params = useParams<{ id: string }>();
  const albumId = params.id;

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAlbum() {
    setLoading(true);
    const response = await fetch(`/api/albums/${albumId}`);
    const data = await response.json();
    setAlbum(data.album ?? null);
    setPhotos(data.photos ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAlbum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [albumId]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    const response = await fetch(`/api/albums/${albumId}/photos`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    setUploading(false);

    if (data.errors && data.errors.length > 0) {
      setError(data.errors.join(' | '));
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
    loadAlbum();
  }

  async function handleDeletePhoto(photoId: number) {
    if (!confirm('Excluir esta foto? Essa ação não pode ser desfeita.')) return;

    const response = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });

    if (!response.ok) {
      setError('Não foi possível excluir a foto. Tente novamente.');
      return;
    }

    loadAlbum();
  }

  if (loading) {
    return <main style={{ padding: 24 }}>Carregando...</main>;
  }

  if (!album) {
    return <main style={{ padding: 24 }}>Álbum não encontrado.</main>;
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <p>
        <a href="/">&larr; Voltar aos álbuns</a>
      </p>
      <h1>{album.name}</h1>

      <div style={{ marginBottom: 24 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleUpload}
          disabled={uploading}
        />
        {uploading && <p>Enviando...</p>}
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {photos.length === 0 ? (
        <p>Nenhuma foto ainda. Adicione a primeira acima.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {photos.map((photo) => (
            <div key={photo.id} style={{ position: 'relative' }}>
              <div
                data-photo-id={photo.id}
                style={{ position: 'relative', width: '100%', height: 140, cursor: 'pointer', background: '#f0f0f0' }}
              >
                <Image src={photo.blob_url} alt={photo.filename} fill style={{ objectFit: 'cover' }} />
              </div>
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                style={{ position: 'absolute', top: 4, right: 4 }}
              >
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verificar no navegador**

Acesse um álbum pela grade da home. Faça upload de 2-3 fotos de uma vez pelo seletor de arquivos e confirme que aparecem na grade. Tente subir um arquivo `.txt` renomeado para `.png` e confirme que uma mensagem de erro aparece (a validação de tipo real no servidor barra pelo `Content-Type` do arquivo, não pela extensão). Exclua uma foto e confirme o diálogo de confirmação e o sumiço da foto da grade.

- [ ] **Step 3: Commit**

```bash
git add "app/albuns/[id]/page.tsx"
git commit -m "feat: add album detail page with photo grid and upload"
```

---

### Task 10: Lightbox (visualização ampliada)

**Files:**
- Create: `components/Lightbox.tsx`
- Modify: `app/albuns/[id]/page.tsx`

- [ ] **Step 1: Criar `components/Lightbox.tsx`**

```tsx
'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';

type Photo = {
  id: number;
  blob_url: string;
  filename: string;
};

type LightboxProps = {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDelete: (photoId: number) => void;
};

export default function Lightbox({ photos, index, onClose, onIndexChange, onDelete }: LightboxProps) {
  const photo = photos[index];

  const goPrev = useCallback(() => {
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, photos.length, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((index + 1) % photos.length);
  }, [index, photos.length, onIndexChange]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{ position: 'absolute', top: 16, right: 16, fontSize: 24, color: '#fff', background: 'none', border: 'none' }}
      >
        ✕
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          goPrev();
        }}
        style={{ position: 'absolute', left: 16, fontSize: 32, color: '#fff', background: 'none', border: 'none' }}
      >
        ‹
      </button>

      <div style={{ position: 'relative', width: '80vw', height: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <Image src={photo.blob_url} alt={photo.filename} fill style={{ objectFit: 'contain' }} />
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
        style={{ position: 'absolute', right: 16, fontSize: 32, color: '#fff', background: 'none', border: 'none' }}
      >
        ›
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(photo.id);
        }}
        style={{ position: 'absolute', bottom: 16, color: '#fff', background: 'none', border: '1px solid #fff', padding: '8px 16px' }}
      >
        Excluir foto
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Modificar `app/albuns/[id]/page.tsx` para usar o Lightbox**

Adicionar o import e o estado do índice do lightbox logo após os outros imports/estado existentes:

```tsx
import Lightbox from '@/components/Lightbox';
```

(adicionar junto aos outros imports no topo do arquivo)

Adicionar o estado, junto aos outros `useState`:

```tsx
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
```

Alterar a `div` de cada foto na grade para abrir o lightbox ao clicar (adicionar `onClick`):

```tsx
              <div
                data-photo-id={photo.id}
                onClick={() => setLightboxIndex(photos.indexOf(photo))}
                style={{ position: 'relative', width: '100%', height: 140, cursor: 'pointer', background: '#f0f0f0' }}
              >
```

Alterar `handleDeletePhoto` para fechar o lightbox após excluir, adicionando `setLightboxIndex(null);` antes de `loadAlbum();`:

```tsx
  async function handleDeletePhoto(photoId: number) {
    if (!confirm('Excluir esta foto? Essa ação não pode ser desfeita.')) return;

    const response = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' });

    if (!response.ok) {
      setError('Não foi possível excluir a foto. Tente novamente.');
      return;
    }

    setLightboxIndex(null);
    loadAlbum();
  }
```

Renderizar o `Lightbox` logo antes do fechamento da tag `</main>`:

```tsx
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          onDelete={handleDeletePhoto}
        />
      )}
```

- [ ] **Step 3: Verificar no navegador**

Abra um álbum com pelo menos 3 fotos. Clique numa foto da grade e confirme que o lightbox abre em tela cheia com a foto ampliada. Use as setas `‹`/`›` (e as teclas de seta do teclado) para navegar entre fotos, confirmando que a navegação circula (da última volta pra primeira e vice-versa). Pressione `Esc` e confirme que fecha. Abra de novo e clique em "Excluir foto" dentro do lightbox — confirme que pede confirmação, exclui e fecha o lightbox.

- [ ] **Step 4: Commit**

```bash
git add components/Lightbox.tsx "app/albuns/[id]/page.tsx"
git commit -m "feat: add lightbox for enlarged photo view with navigation"
```

---

### Task 11: Deploy para produção (Vercel)

Esta tarefa é majoritariamente manual (contas/dashboard), já que criar repositórios remotos e publicar em produção são ações que afetam infraestrutura compartilhada — confirme com o usuário antes de cada `git push` e antes de conectar/deployar no dashboard da Vercel.

**Files:**
- Nenhum arquivo novo.

- [ ] **Step 1: Criar repositório remoto (GitHub) e enviar o código**

Crie um repositório novo no GitHub (pelo site ou `gh repo create`), depois:

```bash
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin master
```

- [ ] **Step 2: Importar o projeto na Vercel**

No dashboard da Vercel, **Add New → Project**, selecione o repositório recém-criado e importe (framework detectado automaticamente como Next.js).

- [ ] **Step 3: Conectar o Neon e o Vercel Blob ao projeto (se ainda não conectados)**

Na aba **Storage** do projeto na Vercel, confirme que o banco Neon e o Blob store criados na Task 2 estão conectados a este projeto (isso injeta `DATABASE_URL` e `BLOB_READ_WRITE_TOKEN` automaticamente nas variáveis de ambiente de produção).

- [ ] **Step 4: Configurar `SITE_PASSWORD` e `SESSION_SECRET` em produção**

Em **Settings → Environment Variables**, adicione `SITE_PASSWORD` e `SESSION_SECRET` com os mesmos valores (ou novos, se preferir) usados em `.env.local`.

- [ ] **Step 5: Rodar o schema no banco de produção (se for um banco Neon diferente do usado em dev)**

Se o banco Neon conectado à Vercel for o mesmo usado em desenvolvimento (Task 3), pule este passo. Caso seja um banco novo, repita o Step 3 da Task 3 apontando para a `DATABASE_URL` de produção.

- [ ] **Step 6: Deploy**

Clique em **Deploy** no dashboard da Vercel. Aguarde o build finalizar.

- [ ] **Step 7: Verificar em produção**

Acesse a URL gerada pela Vercel (ex.: `https://album-de-fotos.vercel.app`). Confirme que redireciona para `/login`, que a senha configurada funciona, e que criar álbum + upload de foto + exclusão + lightbox funcionam como em desenvolvimento (repita rapidamente os passos manuais das Tasks 5, 7, 9 e 10).

---

### Task 12: QA manual final

Percorra os fluxos principais do spec de ponta a ponta, em produção ou local, confirmando cada um:

- [ ] Acessar o site sem estar logado redireciona para `/login`.
- [ ] Login com senha errada mostra mensagem de erro e não entra.
- [ ] Login com senha correta entra e mostra a grade de álbuns.
- [ ] Criar um novo álbum funciona e ele aparece na grade.
- [ ] Entrar num álbum mostra a grade de fotos (vazia, se novo).
- [ ] Upload de múltiplas fotos de uma vez funciona e todas aparecem na grade.
- [ ] Upload de um arquivo que não é imagem é rejeitado com mensagem clara.
- [ ] Clicar numa foto abre o lightbox em tamanho ampliado.
- [ ] Navegar entre fotos no lightbox (setas e teclado) funciona, incluindo dar a volta do fim pro começo.
- [ ] Excluir uma foto (pela grade ou pelo lightbox) pede confirmação e remove a foto.
- [ ] Excluir um álbum pede confirmação e remove o álbum e todas as suas fotos (confirmar que as fotos somem do Blob — reabrir o álbum não deve mais existir).
- [ ] Fechar o navegador e voltar depois: sessão continua válida (cookie de 30 dias) sem precisar logar de novo.
