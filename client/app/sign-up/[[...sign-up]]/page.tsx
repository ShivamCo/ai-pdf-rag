import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-6 p-4 sm:p-6">
      <Link
        href="/"
        className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition hover:text-accent"
      >
        ← Back
      </Link>

      <SignUp />
    </div>
  );
}
