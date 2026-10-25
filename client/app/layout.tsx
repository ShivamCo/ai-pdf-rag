import type { Metadata } from 'next';
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Docsy — Read less, know more',
  description:
    'Chat with any PDF and get answers with exact page citations. Powered by Claude and Qdrant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: '#1a1915',
              colorBackground: '#fbf9f4',
              colorForeground: '#1a1915',
              borderRadius: '0.25rem',
            },
          }}
        >
          <header className="sticky top-0 z-50 w-full border-b border-rule bg-paper/90 backdrop-blur-sm">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
              <Link href="/" className="group flex items-baseline gap-2">
                <span className="font-serif text-2xl italic leading-none tracking-tight">
                  Docsy
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition group-hover:text-accent">
                  pdf / ask
                </span>
              </Link>

              <div className="flex items-center gap-5">
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="cursor-pointer text-sm text-muted transition hover:text-ink">
                      Sign in
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button className="cursor-pointer rounded-full bg-ink px-4 py-1.5 text-sm text-paper transition hover:bg-accent">
                      Start reading →
                    </button>
                  </SignUpButton>
                </Show>

                <Show when="signed-in">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'h-8 w-8',
                      },
                    }}
                  />
                </Show>
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
