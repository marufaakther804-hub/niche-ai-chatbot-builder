"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  MessageSquare,
  Code,
  FileText,
  Trash2,
  Copy,
  Check,
  Loader2,
  Send,
} from "lucide-react";

interface Chatbot {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  welcome_message: string;
  created_at: string;
}

interface Document {
  id: string;
  file_name: string;
  created_at: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "preview" | "embed">("documents");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchChatbot();
      fetchDocuments();
    }
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatbot = async () => {
    try {
      const res = await fetch(`/api/chatbots/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setChatbot(data);
      setMessages([{ role: "assistant", content: data.welcome_message }]);
    } catch (error) {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/documents?chatbotId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("chatbotId", id);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      await fetchDocuments();
      alert(`Successfully uploaded! Created ${data.chunks} chunks.`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteBot = async () => {
    if (!confirm("Are you sure you want to delete this chatbot?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/chatbots/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard");
    } finally {
      setDeleting(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatbotId: id,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const embedCode = `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${id}" defer></script>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!chatbot) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <button
          onClick={handleDeleteBot}
          disabled={deleting}
          className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1.5"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">{chatbot.name}</h1>
        {chatbot.description && (
          <p className="text-slate-600 mt-1">{chatbot.description}</p>
        )}
      </div>

      <div className="flex gap-1 border-b mb-6">
        {[
          { id: "documents", label: "Documents", icon: FileText },
          { id: "preview", label: "Preview Chat", icon: MessageSquare },
          { id: "embed", label: "Embed Code", icon: Code },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-black text-black"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "documents" && (
        <div>
          <div className="border-2 border-dashed rounded-xl p-8 text-center mb-6 bg-white">
            <Upload className="w-8 h-8 mx-auto text-slate-400 mb-3" />
            <p className="font-medium mb-1">Upload documents</p>
            <p className="text-sm text-slate-500 mb-4">
              Supports PDF, TXT, and MD files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.text,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-60 flex items-center gap-2 mx-auto"
            >
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploading ? "Uploading & Embedding..." : "Choose Files"}
            </button>
          </div>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No documents uploaded yet. Upload some knowledge base files.
              </p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="font-medium text-sm">{doc.file_name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "preview" && (
        <div className="bg-white border rounded-xl overflow-hidden max-w-lg shadow-sm">
          <div className="bg-slate-900 text-white px-4 py-3 text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            {chatbot.name}
          </div>

          <div className="h-96 p-4 overflow-y-auto space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-black text-white rounded-br-sm"
                      : "bg-white border rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t p-3 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              onClick={sendMessage}
              disabled={chatLoading || !input.trim()}
              className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === "embed" && (
        <div className="max-w-2xl">
          <p className="text-slate-600 mb-4">
            Copy this code and paste it into your website before the closing{" "}
            <code className="bg-slate-100 px-1 rounded">&lt;/body&gt;</code> tag.
          </p>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-sm overflow-x-auto">
              {embedCode}
            </pre>
            <button
              onClick={copyEmbed}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
