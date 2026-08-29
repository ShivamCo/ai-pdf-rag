import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Page() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-blue-400/15 via-indigo-300/15 to-violet-300/15 blur-3xl -z-10 rounded-full pointer-events-none" />

      <div className="mb-6 flex flex-col items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-2"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="shadow-2xl shadow-slate-200 rounded-3xl overflow-hidden">
        <SignIn />
      </div>
    </div>
  );
}