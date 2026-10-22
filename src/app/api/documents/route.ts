import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";
import { NextRequest, NextResponse } from "next/server";

// Simple text chunker
function chunkText(text: string, chunkSize = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks.filter((c) => c.trim().length > 20);
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = file.name.toLowerCase();

  // PDF Support
  if (fileName.endsWith(".pdf")) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (err) {
      console.error("PDF parsing error:", err);
      throw new Error(
        "PDF parsing failed. Please run: npm install pdf-parse"
      );
    }
  }

  // TXT / MD / others
  if (
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md") ||
    fileName.endsWith(".text") ||
    fileName.endsWith(".csv")
  ) {
    return buffer.toString("utf-8");
  }

  // Fallback
  return buffer.toString("utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const chatbotId = formData.get("chatbotId") as string;
    const textContent = formData.get("text") as string | null;

    if (!chatbotId) {
      return NextResponse.json(
        { error: "chatbotId required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify ownership
    const { data: bot } = await supabase
      .from("chatbots")
      .select("id")
      .eq("id", chatbotId)
      .eq("user_id", userId)
      .single();

    if (!bot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    let content = "";
    let fileName = "pasted-text.txt";

    if (file) {
      fileName = file.name;
      content = await extractTextFromFile(file);
    } else if (textContent) {
      content = textContent;
    } else {
      return NextResponse.json(
        { error: "No file or text provided" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file" },
        { status: 400 }
      );
    }

    // Limit content size
    content = content.slice(0, 100000);

    // 1. Save document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        chatbot_id: chatbotId,
        file_name: fileName,
        content,
      })
      .select()
      .single();

    if (docError || !doc) {
      return NextResponse.json(
        { error: docError?.message || "Failed to save document" },
        { status: 500 }
      );
    }

    // 2. Chunk + Create Embeddings
    const chunks = chunkText(content);
    const embeddingsToInsert = [];

    for (let i = 0; i < chunks.length; i += 20) {
      const batch = chunks.slice(i, i + 20);

      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
      });

      for (let j = 0; j < batch.length; j++) {
        embeddingsToInsert.push({
          document_id: doc.id,
          chatbot_id: chatbotId,
          content: batch[j],
          embedding: embeddingRes.data[j].embedding,
        });
      }
    }

    if (embeddingsToInsert.length > 0) {
      const { error: embError } = await supabase
        .from("embeddings")
        .insert(embeddingsToInsert);

      if (embError) {
        console.error("Embedding insert error:", embError);
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        file_name: doc.file_name,
        created_at: doc.created_at,
      },
      chunks: embeddingsToInsert.length,
    });
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET documents of a chatbot
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatbotId = searchParams.get("chatbotId");

    if (!chatbotId) {
      return NextResponse.json(
        { error: "chatbotId required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("documents")
      .select("id, file_name, created_at")
      .eq("chatbot_id", chatbotId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
