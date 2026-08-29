"use client";

import {
  FileText,
  Sparkles,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Database,
  Layers,
  Bot,
  User,
  ExternalLink,
} from "lucide-react";
import { SignUpButton, SignInButton } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* ========================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-400/20 via-indigo-300/20 to-purple-300/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-200/80 bg-blue-50/80 backdrop-blur-sm text-xs font-semibold text-blue-700 shadow-xs mb-8">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
          <span>Next-Gen RAG with Google Gemini & Cloudflare R2</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.12]">
          Chat with any PDF in{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Seconds
          </span>{" "}
          with Exact Citations
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
          Stop skimming 100-page reports and textbooks. Ask questions naturally and receive
          accurate answers backed by exact page references from your documents.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <SignUpButton mode="modal">
            <button className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]">
              <Sparkles className="h-4 w-4" />
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button className="cursor-pointer inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-base font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]">
              <span>Sign In to Account</span>
            </button>
          </SignInButton>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Store up to 5 PDFs Free</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Exact Page Citations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Persistent Chat History</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE MOCK PREVIEW CARD */}
        {/* ========================================================= */}
        <div className="mt-16 w-full max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-2xl shadow-slate-200/60 transition-all hover:shadow-blue-500/5">
          {/* Mock App Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 px-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-600">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <span>Quarterly_Financial_Report_2024.pdf</span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">Ready</span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400">DocuMind AI Preview</span>
          </div>

          {/* Mock Chat Body */}
          <div className="p-4 sm:p-6 space-y-5 text-left bg-slate-50/50 rounded-2xl mt-3">
            {/* User Question */}
            <div className="flex items-start gap-3 justify-end">
              <div className="rounded-2xl rounded-tr-xs bg-blue-600 px-4 py-2.5 text-xs sm:text-sm text-white shadow-xs max-w-[85%] sm:max-w-[70%]">
                What are the total net revenue and key growth drivers mentioned in Q3?
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                <User className="h-4 w-4" />
              </div>
            </div>

            {/* AI Answer */}
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="space-y-2 rounded-2xl rounded-tl-xs border border-slate-200 bg-white p-4 text-xs sm:text-sm text-slate-800 shadow-xs max-w-[90%] sm:max-w-[80%]">
                <p className="font-normal leading-relaxed">
                  According to the report, net revenue in Q3 reached <strong className="font-semibold text-slate-950">$48.2 million</strong>, representing an increase of <strong>24% year-over-year</strong>.
                </p>
                <p className="font-normal leading-relaxed text-slate-600">
                  The primary growth drivers were expansion in enterprise SaaS subscriptions (+32%) and higher adoption in international markets.
                </p>

                {/* Source citations */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Search className="h-3 w-3" /> Sources:
                  </span>
                  <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    Page 4
                  </span>
                  <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    Page 11
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. CORE FEATURES GRID */}
      {/* ========================================================= */}
      <section className="py-20 bg-white border-y border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Supercharged RAG Pipeline</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Speed, Precision, and Accuracy
            </p>
            <p className="mt-4 text-slate-600 text-sm sm:text-base">
              Built with state-of-the-art vector embedding technology and modern cloud infrastructure.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 transition hover:border-blue-500/50 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-110 transition">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">Instant Semantic Search</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Text chunks are indexed with high-dimensional Google Gemini embeddings stored in a blazing-fast Qdrant vector database.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 transition hover:border-indigo-500/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-110 transition">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">Exact Page References</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Never second-guess an answer. Every insight is tagged with exact page numbers directly from your original document.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 transition hover:border-violet-500/50 hover:bg-white hover:shadow-xl hover:shadow-violet-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md shadow-violet-500/20 group-hover:scale-110 transition">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">Cloudflare R2 Storage</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Documents are securely stored on Cloudflare R2 object storage with fast S3-compatible edge distribution.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative rounded-3xl border border-slate-200/80 bg-slate-50/50 p-6 transition hover:border-emerald-500/50 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-110 transition">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-base font-bold text-slate-900">Multi-Document History</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Manage up to 5 documents per account. Each PDF retains its isolated conversation thread and indexed vectors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. HOW IT WORKS */}
      {/* ========================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600">Simplicity First</h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How It Works in 3 Easy Steps
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="relative flex flex-col items-center text-center p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-lg mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Upload Your PDF</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Drag and drop any report, paper, or handbook into the secure cloud uploader.
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative flex flex-col items-center text-center p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Asynchronous Indexing</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              BullMQ workers chunk the text, compute vector embeddings, and update document status.
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative flex flex-col items-center text-center p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold text-lg mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Ask & Discover</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Ask questions in plain English and receive instant, source-backed answers with page numbers.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. CALL TO ACTION BANNER */}
      {/* ========================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 sm:p-14 text-center text-white shadow-2xl shadow-blue-500/20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to experience intelligent document chat?
          </h2>
          <p className="mt-4 text-blue-100 max-w-xl mx-auto text-sm sm:text-base">
            Create an account in seconds and upload your first PDF for free.
          </p>
          <div className="mt-8 flex justify-center">
            <SignUpButton mode="modal">
              <button className="cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm sm:text-base font-bold text-blue-700 shadow-lg transition hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98]">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Start Chatting for Free</span>
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FOOTER */}
      {/* ========================================================= */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="font-semibold text-slate-800">DocuMind AI RAG</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <p className="text-slate-400">
            Powered by Google Gemini 2.0, Qdrant Vector Engine & Cloudflare R2
          </p>
        </div>
      </footer>
    </div>
  );
}
