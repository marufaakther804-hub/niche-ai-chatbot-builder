"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewChatbotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    system_prompt:
      "You are a helpful AI assistant for a business. Answer questions based only on the provided knowledge base. If you don't know the answer from the knowledge base, politely say that you don't have that information.",
    welcome_message: "Hi! How can I help you today?",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chatbots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create chatbot");
      }

      router.push(`/dashboard/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-2">Create New Chatbot</h1>
      <p className="text-slate-600 mb-8">
        Give your chatbot a name and personality. You can add documents later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Real Estate Assistant"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description of what this bot does"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            System Prompt
          </label>
          <textarea
            rows={5}
            value={form.system_prompt}
            onChange={(e) =>
              setForm({ ...form, system_prompt: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            This controls the personality and behavior of your chatbot.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Welcome Message
          </label>
          <input
            value={form.welcome_message}
            onChange={(e) =>
              setForm({ ...form, welcome_message: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white font-medium rounded-lg hover:bg-slate-800 disabled:opacity-60 transition"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Creating..." : "Create Chatbot"}
        </button>
      </form>
    </div>
  );
}
