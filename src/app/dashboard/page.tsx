"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Bot, MessageSquare, ExternalLink, Loader2 } from "lucide-react";

interface Chatbot {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      const res = await fetch("/api/chatbots");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChatbots(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Chatbots</h1>
          <p className="text-slate-600 mt-1">
            Create and manage AI chatbots for your business
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" />
          New Chatbot
        </Link>
      </div>

      {chatbots.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-white">
          <Bot className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No chatbots yet
          </h3>
          <p className="text-slate-600 mb-6">
            Create your first AI chatbot in under 5 minutes
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" />
            Create Chatbot
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {chatbots.map((bot) => (
            <Link
              key={bot.id}
              href={`/dashboard/${bot.id}`}
              className="block p-5 bg-white border rounded-xl hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{bot.name}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                {bot.description || "No description"}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  0 messages
                </span>
                <span>
                  Created{" "}
                  {new Date(bot.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
