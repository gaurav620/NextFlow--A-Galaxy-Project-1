# NextFlow — Visual LLM Workflow Builder

A pixel-perfect clone of the [Galaxy.ai](https://try.galaxy.ai/clone) workflow canvas, scoped to LLM workflows. Built as a Galaxy.ai Full-Stack Developer internship trial project.

**Live Demo:** [next-flow-a-galaxy-project-1.vercel.app](https://next-flow-a-galaxy-project-1-gzzl0nr01-gaurav620s-projects.vercel.app)

---

## Features

- **Visual Canvas** — Drag-and-drop workflow builder powered by React Flow with typed handles (text / image / video / audio / file)
- **4 Node Types** — Request Inputs, Gemini (LLM), Crop Image, Response
- **Real-time Execution** — Trigger.dev background tasks with SSE streaming + DB polling fallback; parallel sibling nodes run concurrently
- **Animated Running State** — Rotating conic-gradient border on active nodes, per-node status badges
- **Execution History** — Full run timeline with per-node duration, output preview, and status
- **Dark / Light Theme** — Full dark mode with localStorage persistence and flash prevention
- **Import / Export** — Workflow JSON export and Zod-validated import
- **Image Uploads** — Transloadit (Uppy) with jpg/png/webp/gif support

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript strict) |
| Auth | Clerk |
| Database | PostgreSQL (Neon) + Prisma v5 |
| Canvas | React Flow (`@xyflow/react`) |
| Background Jobs | Trigger.dev v4 |
| LLM | Vercel AI SDK + `@ai-sdk/google` (Gemini 2.5 Flash) |
| Image Upload | Transloadit via Uppy |
| State | Zustand |
| Validation | Zod |
| Styling | Tailwind CSS v4 |

---

## Local Development

```bash
npm install
cp .env.example .env.local   # fill in all keys
npx prisma migrate dev
npm run dev                  # Next.js dev server
npx trigger.dev@latest dev   # Trigger.dev local worker (separate terminal)
```

Required env vars: `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `TRIGGER_SECRET_KEY`, `TRANSLOADIT_AUTH_KEY`, `TRANSLOADIT_TEMPLATE_ID`

---

## Workflow Execution Architecture

```
User clicks Run
    │
    ▼
POST /api/runs  ──►  Trigger.dev workflowOrchestratorTask
                         │
                         ▼
                   buildExecGraph() → topological order
                         │
                         ▼
                   Per-node Promise barriers (await direct parents only)
                   → Sibling nodes execute in parallel
                         │
                         ▼
SSE stream (/api/runs/[id]/stream) + DB polling fallback (2s interval)
                         │
                         ▼
Canvas nodes animate (rotating gradient border) → output renders inline
```

Gemini nodes retry up to 3× with 20s / 45s backoff on quota errors, then fall back to demo content so the workflow always completes.

---

## Built By

**Gaurav Kumar Mehta**
🔗 [linkedin.com/in/gauravkumarmehta](https://www.linkedin.com/in/gauravkumarmehta/)
