# Docsy AI — Intelligent PDF Chat & RAG Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=for-the-badge&logo=next.js&logoColor=white)
![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Qdrant](https://img.shields.io/badge/Qdrant%20Vector%20DB-DC2626?style=for-the-badge&logo=qdrant&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare%20R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk%20Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)

**Chat with any PDF in seconds with verified answers, exact page citations, and cloud vector search.**

[Key Features](#features) • [Architecture](#architecture) • [Local Setup](#local-development) • [Deployment](#deployment) • [API Reference](#api-reference)

</div>

---

## Overview

**Docsy AI** is a production-ready **Retrieval-Augmented Generation (RAG)** application that allows users to upload PDF documents (financial reports, research papers, documentation, textbooks) and converse with them naturally.

Every answer generated is grounded strictly in the document content and tagged with **exact page citations**, eliminating hallucinations and enabling immediate verification.

---

## Features

- **Semantic Search**: Text is split into overlapping chunks, vectorized with Google Gemini embeddings (`gemini-embedding-2`), and indexed in **Qdrant Vector Database**.
- **Exact Page Citations**: Every response returns exact source page numbers (e.g. `Page 4`, `Page 11`) for fast reference checking.
- **Asynchronous Indexing**: Document parsing and vector embedding generation run in the background without blocking upload requests.
- **Cloudflare R2 Storage**: PDF files are persisted securely in S3-compatible R2 buckets with zero egress fees.
- **Multi-Tenant User Auth**: User isolation powered by **Clerk Authentication**, with per-user document quotas (up to 5 PDFs).
- **Persistent Chat History**: Previous conversations are saved per-document in **PostgreSQL** via **Prisma ORM**.
- **Real-Time Polling UI**: Clean Next.js 16 interface that automatically tracks document processing status and updates in real-time without page reloads.

---

## Architecture

```mermaid
flowchart TD
    User([User / Browser])
    Client[Next.js 16 Client App]
    Clerk[Clerk Auth Provider]
    API[Express API Server on Cloud Run]
    Queue[(BullMQ / Async Fallback)]
    Worker[PDF Processing Worker]
    R2[(Cloudflare R2 Storage)]
    Postgres[(PostgreSQL Database)]
    Qdrant[(Qdrant Vector DB)]
    Gemini[Google Gemini API]

    User -->|Interacts| Client
    Client -->|Authenticates| Clerk
    Client -->|Upload PDF / Chat query| API
    
    API -->|Store document record| Postgres
    API -->|Upload PDF binary| R2
    API -->|Dispatch job| Queue
    
    Queue -->|Process PDF| Worker
    Worker -->|Download PDF buffer| R2
    Worker -->|Generate embeddings| Gemini
    Worker -->|Store vector chunks| Qdrant
    Worker -->|Update status: COMPLETED| Postgres

    API -->|Vector similarity search| Qdrant
    API -->|Grounded RAG prompt| Gemini
    API -->|Persist message & citations| Postgres
    API -->|Return structured response| Client
```

---

## Tech Stack

### **Frontend** (`client/`)
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **Authentication**: `@clerk/nextjs`
- **HTTP Client**: Axios

### **Backend** (`server/`)
- **Runtime**: Node.js 20 (ES Modules)
- **Framework**: Express 5
- **Database**: PostgreSQL with Prisma ORM 6
- **Vector DB**: Qdrant Cloud (`@langchain/qdrant`)
- **Object Storage**: Cloudflare R2 (`@aws-sdk/client-s3`)
- **LLM & Embeddings**: Google Gemini API (`@google/genai`, `@langchain/google-genai`)
- **Job Processing**: BullMQ / in-process async worker fallback
- **Hosting**: Google Cloud Run & Artifact Registry

---

## Local Development

### Prerequisites
- **Node.js**: `v20.x` or later
- **Docker Desktop** (optional for local database & vector store)
- Free tier accounts for **Clerk**, **Google AI Studio**, **Qdrant Cloud**, and **Cloudflare R2**.

---

### 1. Clone the Repository

```bash
git clone https://github.com/ShivamCo/ai-pdf-rag.git
cd ai-pdf
```

---

### 2. Configure Backend (`server/`)

Create `server/.env`:

```bash
cd server
cp .env.example .env
```

Set the required environment variables:

```env
PORT=8080
ORIGIN_DEV=http://localhost:3000

# Database (PostgreSQL / Prisma Accelerate / Neon)
DATABASE_URL="postgres://user:password@host:5432/dbname?sslmode=require"

# Vector Store (Qdrant Cloud or Local)
QDRANT_URL="https://your-cluster-id.aws.cloud.qdrant.io"
QDRANT_API_KEY="your-qdrant-api-key"

# AI Model Key (Google AI Studio)
GOOGLE_API_KEY="AIzaSy..."

# Cloudflare R2 Object Storage
CLOUDFLARE_S3_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
CLOUDFLARE_ACCESS_KEY_ID="your-access-key-id"
CLOUDFLARE_SECRET_ACCESS_KEY="your-secret-access-key"
CLOUDFLARE_BUCKET_NAME="ai-pdf-bucket"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..."
CLERK_PUBLISHABLE_KEY="pk_test_..."

# Redis (Optional: if not provided, in-process async worker is used)
# REDIS_URL="rediss://default:password@endpoint.upstash.io:6379"
```

Install dependencies and push schema to database:

```bash
npm install
npx prisma db push
```

Start the backend server:

```bash
npm run dev
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

NEXT_PUBLIC_API_URL="http://localhost:8080"
NEXT_PUBLIC_API_URL_PDF="http://localhost:8080"
```

Install dependencies and start development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

### **Backend: Google Cloud Run**

The backend is configured for deployment to **Google Cloud Run** using Google Cloud Build and Artifact Registry.

#### Option A: One-Command Deployment Script
From the project root:

```bash
./deploy.sh
```

#### Option B: NPM Command
From the `server/` directory:

```bash
cd server
npm run deploy
```

#### Option C: Manual CLI Commands
```bash
# 1. Build and push container to Artifact Registry
gcloud builds submit server/ \
  --tag asia-south1-docker.pkg.dev/ai-pdf-506012/my-app-repo/ai-pdf-server:latest \
  --project=ai-pdf-506012

# 2. Deploy to Cloud Run
gcloud run deploy ai-pdf-server \
  --image=asia-south1-docker.pkg.dev/ai-pdf-506012/my-app-repo/ai-pdf-server:latest \
  --region=asia-south1 \
  --project=ai-pdf-506012 \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300
```

---

### **Frontend: Vercel**

1. Import the repository on [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Add the following environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
   - `NEXT_PUBLIC_API_URL=https://ai-pdf-server-614148168155.asia-south1.run.app`
   - `NEXT_PUBLIC_API_URL_PDF=https://ai-pdf-server-614148168155.asia-south1.run.app`
4. Click **Deploy**.
5. Add your Vercel production URL in the [Clerk Dashboard](https://dashboard.clerk.com) under **Allowed Origins** and **Redirects**.

---

## API Reference

### **Documents**
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/upload-document` | Upload PDF file (max 25MB, 5 docs per user quota) | Yes |
| `GET` | `/api/user-documents` | List all documents for the authenticated user | Yes |
| `DELETE` | `/api/documents/:id` | Delete document record, R2 storage object, and chat history | Yes |

### **Chat & RAG**
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/chat` | Query document and receive answer with page citations | Yes |
| `GET` | `/api/chat/history/:documentId` | Retrieve chat message history for a document | Yes |

---

## Project Structure

```
ai-pdf/
├── client/                      # Next.js 16 Frontend
│   ├── app/
│   │   ├── component/
│   │   │   ├── LandingPage.tsx  # Marketing landing page
│   │   │   ├── chatComponent.tsx# Dual-pane workspace & chat
│   │   │   └── fileUpload.tsx   # PDF dropzone uploader
│   │   ├── layout.tsx           # Navbar & Clerk provider
│   │   ├── page.tsx             # Home route
│   │   ├── sign-in/             # Clerk Sign-In route
│   │   └── sign-up/             # Clerk Sign-Up route
│   └── package.json
│
├── server/                      # Express API & Background Worker
│   ├── prisma/
│   │   └── schema.prisma        # PostgreSQL Schema (Document & ChatMessage)
│   ├── src/
│   │   ├── config/              # AI, DB, Qdrant, Redis & Env
│   │   ├── controllers/         # Document & Chat controllers
│   │   ├── jobs/
│   │   │   └── pdfWorker.js     # BullMQ background worker
│   │   ├── middlewares/         # Clerk Auth, Multer, Error handler
│   │   ├── queues/              # Document queue & async dispatcher
│   │   ├── routes/              # Express API routes
│   │   ├── services/            # Storage (R2), PDF chunking & RAG logic
│   │   ├── app.js               # Express application
│   │   └── server.js            # Entry point
│   ├── Dockerfile               # Production container definition
│   └── package.json
│
├── deploy.sh                    # One-command Cloud Run deployment script
├── docker-compose.yml           # Optional local infrastructure
└── README.md                    # Project documentation
```

---

## License

This project is licensed under the [ISC License](LICENSE).
