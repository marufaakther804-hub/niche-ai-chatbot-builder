# NicheChat - AI Chatbot Builder

A complete Next.js niche AI chatbot builder (Chatbase-style MVP).

## ✅ Completed Features

- Landing page + Clerk Authentication
- Create / List / Delete Chatbots
- **Document Upload** (PDF, TXT, MD) + automatic chunking
- **Embedding Generation** (OpenAI text-embedding-3-small)
- **Full RAG Chat** with similarity search
- **Live Preview Chat** inside dashboard
- **Public Embed Widget** (`/embed/[id]`)
- Embed code generator

## Setup

### 1. Install

```bash
cd niche-chatbot
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### 3. Supabase SQL (run everything)

```sql
-- Enable vector
create extension if not exists vector;

-- Chatbots
create table chatbots (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  description text,
  system_prompt text not null,
  welcome_message text default 'Hi! How can I help you today?',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  chatbot_id uuid references chatbots(id) on delete cascade,
  file_name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Embeddings
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chatbot_id uuid references chatbots(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Similarity search function
create or replace function match_embeddings (
  query_embedding vector(1536),
  match_chatbot_id uuid,
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    embeddings.id,
    embeddings.content,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where chatbot_id = match_chatbot_id
    and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
$$;
```

### 4. Run

```bash
npm run dev
```

## How to use

1. Sign up / Login
2. Create a new Chatbot
3. Go to **Documents** tab → Upload PDF/TXT/MD files
4. Go to **Preview Chat** → Test the bot
5. Copy the **Embed Code** and put it on any website

## Project Structure

```
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── dashboard/
│   │   ├── page.tsx             # List chatbots
│   │   ├── new/page.tsx         # Create
│   │   └── [id]/page.tsx        # Detail + Upload + Live Chat
│   ├── embed/[id]/page.tsx      # Public widget
│   └── api/
│       ├── chatbots/            # CRUD
│       ├── documents/           # Upload + Embed
│       └── chat/                # RAG endpoint
├── lib/
│   ├── openai.ts
│   ├── supabase.ts
│   └── utils.ts
└── types/
```

## Notes

- Now supports **PDF, TXT, and MD** files using `pdf-parse`.
- Uses `gpt-4o-mini` + `text-embedding-3-small` (cost effective).
- Embed page is a full chat widget that can be iframed or loaded via script.

---

You now have a working MVP.  
Next business steps: Pick a niche → Get first 5 users → Add Stripe.
