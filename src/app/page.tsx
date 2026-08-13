import { MainClient } from "../components/MainClient";
import { getChapterStats } from "./actions";
import { SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { totalQuestions, chapters } = await getChapterStats();
  const { userId } = await auth();

  return (
    <>
      {!userId ? (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse delay-1000"></div>
          
          <div className="max-w-md w-full bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-10 text-center space-y-8 relative z-10">
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                Apex<span className="text-indigo-500">Civil</span>
              </h1>
              <p className="text-sm text-indigo-200/60 font-medium uppercase tracking-widest">
                Premium Exam Portal
              </p>
            </div>
            
            <p className="text-slate-300 text-lg leading-relaxed">
              Unlock access to over <strong className="text-white font-bold">8,000+</strong> meticulously curated Civil Engineering questions and track your performance.
            </p>
            
            <div className="pt-4">
              <SignInButton mode="modal">
                <button className="w-full bg-white hover:bg-slate-100 text-indigo-950 font-bold py-4 px-6 rounded-2xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:-translate-y-1 text-lg">
                  Sign In to Continue
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      ) : (
        <MainClient totalQuestions={totalQuestions} chapterStats={chapters} />
      )}
    </>
  );
}
