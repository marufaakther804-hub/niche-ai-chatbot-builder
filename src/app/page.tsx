import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl">NicheChat</div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium hover:bg-slate-100 rounded-lg transition">
                  Sign In
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-slate-800 transition">
                  Get Started Free
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-slate-800 transition"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-32 text-center">
        <div className="inline-block mb-6 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
          Built for niche businesses
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
          Build AI Chatbots
          <br />
          <span className="text-blue-600">for your niche</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Create custom AI chatbots trained on your documents, FAQs, and website.
          Perfect for real estate, clinics, e-commerce, coaches and more.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-black text-white font-medium rounded-xl hover:bg-slate-800 transition text-lg">
                Start Building Free →
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-black text-white font-medium rounded-xl hover:bg-slate-800 transition text-lg"
            >
              Go to Dashboard →
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border bg-white shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-2xl">
              📄
            </div>
            <h3 className="font-semibold text-lg mb-2">Train on Your Data</h3>
            <p className="text-slate-600">
              Upload PDFs, documents, or paste website URLs. Your chatbot learns only from your content.
            </p>
          </div>
          <div className="p-6 rounded-2xl border bg-white shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 text-2xl">
              💬
            </div>
            <h3 className="font-semibold text-lg mb-2">Embed Anywhere</h3>
            <p className="text-slate-600">
              Get a simple script to add the chatbot to your website in under 2 minutes.
            </p>
          </div>
          <div className="p-6 rounded-2xl border bg-white shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-2xl">
              📊
            </div>
            <h3 className="font-semibold text-lg mb-2">Analytics & Insights</h3>
            <p className="text-slate-600">
              See what customers ask most and improve your knowledge base over time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-slate-500 text-sm">
        © 2026 NicheChat. Built for founders who want to ship fast.
      </footer>
    </div>
  );
}
