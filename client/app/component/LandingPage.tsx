"use client";

import { SignUpButton, SignInButton } from "@clerk/nextjs";

const STEPS = [
  {
    title: "Upload",
    body: "Drop in any report, paper, contract or handbook. Up to five PDFs, 25 MB each.",
  },
  {
    title: "Index",
    body: "Every page is split into passages and embedded with Gemini, then stored in Qdrant.",
  },
  {
    title: "Ask",
    body: "Ask in plain language. Answers come only from your document, with the pages they came from.",
  },
];

const NOTES = [
  ["Grounded", "Answers are drawn strictly from the PDF, not from the open web."],
  ["Cited", "Every reply points back to the exact pages it relied on."],
  ["Remembered", "Each document keeps its own conversation, ready when you return."],
  ["Private", "Your files are tied to your account and can be deleted any time."],
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-14 px-5 pt-16 pb-24 sm:px-8 md:pt-24 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">
            A reading companion for PDFs
          </p>

          <h1 className="mt-6 font-serif text-6xl leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            Read less.
            <br />
            <span className="italic">Know</span> more.
          </h1>

          <p className="mt-8 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            Ask questions of any PDF and get clear answers, each one annotated
            with the pages it came from.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <SignUpButton mode="modal">
              <button className="cursor-pointer rounded-full bg-ink px-6 py-3 text-sm text-paper transition hover:bg-accent">
                Open your first PDF →
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button className="cursor-pointer text-sm text-ink underline decoration-rule underline-offset-4 transition hover:decoration-accent">
                I already have an account
              </button>
            </SignInButton>
          </div>
        </div>

        {/* Specimen: a page with a margin note */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative rotate-[-1.5deg] border border-rule bg-[#fbf9f4] p-7 sm:p-9">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              <span>annual_report.pdf</span>
              <span>p. 4</span>
            </div>

            <div className="mt-6 space-y-2.5 text-[13px] leading-relaxed text-ink/70">
              <div className="h-2 w-11/12 rounded-full bg-rule/70" />
              <div className="h-2 w-full rounded-full bg-rule/70" />
              <div className="h-2 w-4/5 rounded-full bg-rule/70" />
              <p className="pt-1 text-ink">
                <span className="highlight-sweep">
                  Net revenue for the third quarter reached $48.2M, up 24% year
                  over year,
                </span>{" "}
                driven by enterprise subscriptions.
              </p>
              <div className="h-2 w-full rounded-full bg-rule/70" />
              <div className="h-2 w-3/4 rounded-full bg-rule/70" />
              <div className="h-2 w-5/6 rounded-full bg-rule/70" />
            </div>
          </div>

          <div className="relative -mt-6 ml-auto w-[85%] rotate-[1deg] border-l-2 border-accent bg-paper py-4 pl-5 pr-4 sm:-mr-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              You asked
            </p>
            <p className="mt-1 font-serif text-xl italic leading-snug">
              How much did revenue grow in Q3?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              Revenue grew 24% year over year to $48.2M, mainly from
              enterprise subscriptions.
            </p>
            <p className="mt-3 font-mono text-[11px] text-accent">↳ p. 4</p>
          </div>
        </div>
      </section>

      {/* Method */}
      <section className="border-t border-rule">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-4xl italic sm:text-5xl">Method</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              three steps
            </span>
          </div>

          <ol className="mt-12 divide-y divide-rule border-y border-rule">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="group grid grid-cols-[3rem_1fr] gap-4 py-7 sm:grid-cols-[5rem_12rem_1fr] sm:items-baseline"
              >
                <span className="font-mono text-sm text-muted transition group-hover:text-accent">
                  0{i + 1}
                </span>
                <h3 className="font-serif text-3xl">{step.title}</h3>
                <p className="col-start-2 max-w-lg text-sm leading-relaxed text-muted sm:col-start-3">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Notes */}
      <section className="border-t border-rule bg-paper-deep/50">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-16 gap-y-10 px-5 py-20 sm:grid-cols-2 sm:px-8">
          {NOTES.map(([title, body]) => (
            <div key={title} className="border-l border-rule pl-5">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                {title}
              </h3>
              <p className="mt-3 font-serif text-2xl leading-snug">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-24 sm:px-8 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-xl font-serif text-5xl leading-[1.05] sm:text-6xl">
            Your next long read,
            <br />
            <span className="italic text-accent">already annotated.</span>
          </h2>

          <SignUpButton mode="modal">
            <button className="cursor-pointer rounded-full bg-ink px-6 py-3 text-sm text-paper transition hover:bg-accent">
              Start free →
            </button>
          </SignUpButton>
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 font-mono text-[11px] text-muted sm:flex-row sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Docsy</span>
          <span>Claude · Qdrant · Cloudflare R2</span>
        </div>
      </footer>
    </div>
  );
}
