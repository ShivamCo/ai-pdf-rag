# 📄 Docsy AI — Intelligent PDF Chat & RAG Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant%20Vector%20DB-DC2626?style=for-the-badge&logo=qdrant&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk%20Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)

**Chat with any PDF in seconds with verified answers, exact page citations, and cloud vector search.**

[Live Demo](#-deployment-guide) • [Key Features](#-features) • [Architecture](#-architecture) • [Local Setup](#-getting-started) • [API Docs](#-api-endpoints)

</div>

---

## 🌟 Overview

**Docsy AI** is a production-ready **Retrieval-Augmented Generation (RAG)** platform designed to transform static PDF documents (financial reports, research papers, textbooks, legal filings, and manuals) into interactive conversational knowledge bases.

Users can upload documents, index their contents asynchronously through background queue workers, and ask complex questions — receiving precise answers backed by **exact page citations** in real time.

---

## ✨ Features

- ⚡ **Instant Semantic Search**: High-dimensional text embeddings generated via **Google Gemini** and stored in **Qdrant Vector Database**.
- 🎯 **Exact Page Citations**: Every generated insight cites specific source page numbers (e.g., `Page 4`, `Page 11`) so users can verify facts instantly.
- 📦 **Asynchronous Processing Queue**: Heavy PDF parsing, chunking, and embedding generation are offloaded to **BullMQ** & **Redis** background workers, keeping API responses lightning-fast.
- ☁️ **Cloud Storage**: Secure, scalable PDF file persistence powered by **Cloudflare R2** with $0 egress fees.
- 🔒 **User Isolation & Authentication**: Complete multi-tenant isolation with **Clerk Authentication**, enforcing a quota of up to **5 PDFs per account**.
- 💬 **Persistent Chat History**: Previous conversations are saved per-document in **PostgreSQL** via **Prisma ORM**.
- 🎨 **Modern Next.js 16 UI**: Sleek landing page for signed-out visitors, interactive preview simulations, prompt suggestion chips, and responsive dual-pane workspace for authenticated users.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    User([User / Browser])
    Client[Next.js 16 Frontend App]
    Clerk[Clerk Auth Provider]
    API[Express REST API Server]
    Queue[(BullMQ / Redis Queue)]
    Worker[PDF Background Worker]
    R2[(Cloudflare R2 Storage)]
    Postgres[(PostgreSQL Database)]
    Qdrant[(Qdrant Vector DB)]
    Gemini[Google Gemini 2.0 / Flash]

    User -->|Interacts| Client
    Client -->|Authenticates| Clerk
    Client -->|Upload PDF / Chat query| API
    
    API -->|Store metadata & status| Postgres
    API -->|Upload file| R2
    API -->|Enqueue file-ready job| Queue
    
    Queue -->|Pulls job| Worker
    Worker -->|Download PDF| R2
    Worker -->|Split chunks & Embeddings| Gemini
    Worker -->|Upsert vectors with metadata| Qdrant
    Worker -->|Update status: COMPLETED| Postgres

    API -->|Similarity Search| Qdrant
    API -->|Prompt + Context| Gemini
    API -->|Save message & citations| Postgres
    API -->|Return stream answer| Client
```

---

## 🛠️ Tech Stack

### **Frontend** (`client/`)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Authentication**: [@clerk/nextjs](https://clerk.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### **Backend & Services** (`server/`)
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM 6](https://www.prisma.io/)
- **Job Queue**: [BullMQ](https://bullmq.io/) with [IORedis](https://github.com/redis/ioredis)
- **Vector Database**: [Qdrant](https://qdrant.tech/) with `@langchain/qdrant`
- **Object Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via `@aws-sdk/client-s3`
- **AI & Embeddings**: [Google Gen AI SDK](https://github.com/google-gemini/generative-ai-js) & `@langchain/google-genai`
- **Document Processing**: `@langchain/community` PDF loader & `@langchain/textsplitters`

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or later
- **Docker Desktop** (optional for local Valkey/Postgres/Qdrant)
- **Accounts / Keys** (free tiers):
  - [Clerk](https://clerk.com/)
  - [Google AI Studio](https://aistudio.google.com/)
  - [Qdrant Cloud](https://cloud.qdrant.io/)
  - [Cloudflare R2](https://dash.cloudflare.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/ShivamCo/ai-pdf-rag/
cd ai-pdf
```

---

### 2. Configure Backend (`server/`)

Create `server/.env` with your environment variables:

```bash
cd server
cp .env.example .env
```

Fill in your credentials:

```env
PORT=5300
ORIGIN_DEV=http://localhost:3000

# Database (Local Postgres or Prisma Cloud/Neon)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/aipdf?schema=public"

# Redis (Local or Upstash)
REDIS_HOST="localhost"
REDIS_PORT=6379
# REDIS_URL="rediss://default:password@endpoint.upstash.io:6379"

# Vector Store (Qdrant Cloud or Local)
QDRANT_URL="https://your-cluster-id.us-west-1-0.aws.cloud.qdrant.io"
QDRANT_API_KEY="your-qdrant-api-key"

# AI Model Key
GOOGLE_API_KEY="your-gemini-api-key"

# Cloudflare R2 Object Storage
CLOUDFLARE_S3_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
CLOUDFLARE_ACCESS_KEY_ID="your-r2-access-key-id"
CLOUDFLARE_SECRET_ACCESS_KEY="your-r2-secret-access-key"
CLOUDFLARE_BUCKET_NAME="ai-pdf-bucket"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."
```

Install dependencies & sync database:

```bash
npm install
npx prisma db push
```

---

### 3. Configure Frontend (`client/`)

Create `client/.env.local`:

```bash
cd ../client
```

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

NEXT_PUBLIC_API_URL="http://localhost:5300"
```

Install client dependencies:

```bash
npm install
```

---

### 4. Running the Application Locally

#### Option A: Using Docker for Infrastructure
From the project root:

```bash
# 1. Start Postgres, Valkey (Redis), and Qdrant in Docker
docker compose up -d

# 2. Start the Backend API Server
cd server
npm run dev

# 3. Start the Background Worker (in a separate terminal)
cd server
npm run dev:worker

# 4. Start the Frontend App (in a separate terminal)
cd client
npm run dev
```

#### Option B: Using Cloud Services (Prisma Cloud, Upstash, Qdrant Cloud)
If you already use hosted cloud instances (e.g. Upstash, Qdrant Cloud, Prisma Postgres), simply start:

```bash
# In server/
npm run dev
npm run dev:worker

# In client/
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints

### **Document Management**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/upload-document` | Upload PDF (enforces 5 PDF limit per user) | ✅ |
| `GET` | `/api/user-documents` | List all documents belonging to user | ✅ |
| `DELETE`| `/api/documents/:id` | Delete document, R2 file, and chat history | ✅ |

### **Chat & RAG Operations**
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/chat` | Query document & receive answer + page citations | ✅ |
| `GET` | `/api/chat/history/:documentId` | Fetch message history for selected document | ✅ |

---

## 🌐 Deployment Guide (100% Free)

### **1. Deploy Backend on [Render.com](https://render.com) / [Railway](https://railway.app)**
1. Create a new **Web Service** and connect your repo.
2. Set **Root Directory** to `server`.
3. Set **Build Command**: `npm install && npx prisma db push`.
4. Set **Start Command**: `npm start` *(starts both API server and background worker)*.
5. Add your environment variables from `server/.env`.
6. Copy your live backend URL (e.g. `https://docsy-api.onrender.com`).

### **2. Deploy Frontend on [Vercel](https://vercel.com)**
1. Import repository on Vercel.
2. Set **Root Directory** to `client`.
3. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_API_URL=https://docsy-api.onrender.com` *(from step 1)*
4. Click **Deploy**.

### **3. Update Clerk Redirect URLs**
- In [Clerk Dashboard](https://dashboard.clerk.com), add your production Vercel domain (`https://your-app.vercel.app`) under **Allowed Origins** and **Redirects**.

---

## 📁 Project Structure

```
ai-pdf/
├── client/                      # Next.js 16 Frontend
│   ├── app/
│   │   ├── component/
│   │   │   ├── LandingPage.tsx  # Signed-out landing page
│   │   │   ├── chatComponent.tsx# Main 2-pane workspace & chat
│   │   │   └── fileUpload.tsx   # Drag-and-drop uploader
│   │   ├── layout.tsx           # Navigation bar & Clerk provider
│   │   ├── page.tsx             # Home route switcher
│   │   ├── sign-in/             # Clerk Sign-In page
│   │   └── sign-up/             # Clerk Sign-Up page
│   └── package.json
│
├── server/                      # Express API & RAG Worker
│   ├── prisma/
│   │   └── schema.prisma        # PostgreSQL Document & Chat models
│   ├── src/
│   │   ├── config/              # AI, DB, Qdrant, Redis & Env configs
│   │   ├── controllers/         # Document & Chat controllers
│   │   ├── jobs/
│   │   │   └── pdfWorker.js     # BullMQ background processing worker
│   │   ├── middlewares/         # Clerk Auth, Multer, Error handlers
│   │   ├── queues/              # BullMQ queue definitions
│   │   ├── routes/              # Express API routes
│   │   ├── services/            # Storage, PDF chunking, RAG service
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # Entry point
│   └── package.json
│
├── docker-compose.yml           # Local dev services (Valkey, Postgres, Qdrant)
└── README.md                    # Project documentation
```

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
