import type { Metadata } from 'next';
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import { FileText, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import './globals.css';
import Image from 'next/image';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI PDF RAG - Intelligent PDF Search & Chat',
  description:
    'Chat with any PDF in seconds. Powered by Google Gemini, Qdrant vector retrieval, and Cloudflare R2.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
        <ClerkProvider>
          {/* Main Top Navigation */}
          <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Brand Logo */}
              <a href="/" className="group flex items-center gap-2.5 transition">
                <div className="flex h-18 w-18 items-center justify-center  text-white transition group-hover:scale-105">
                  <Image src="/logo.png" alt="Docsy" width={500} height={500} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold tracking-tight text-slate-900">
                      {/* <span className="text-blue-600">Docsy</span> */}
                    </span>
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      AI RAG
                    </span>
                  </div>
                </div>
              </a>

              {/* Right Action Menu */}
              <div className="flex items-center gap-3 sm:gap-4">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="cursor-pointer rounded-xl px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900">
                      Sign In
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-md">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Get Started Free</span>
                    </button>
                  </SignUpButton>
                </Show>

                <Show when="signed-in">
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>RAG Copilot Active</span>
                    </div>

                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'h-9 w-9 ring-2 ring-blue-500/20 shadow-sm',
                        },
                      }}
                    />
                  </div>
                </Show>
              </div>
            </div>
          </header>

          {/* Body Content */}
          <main className="flex-1 flex flex-col">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}