import { openai } from "@/lib/openai";
import { createServiceClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, chatbotId } = await req.json();

    if (!chatbotId || !messages?.length) {
      return NextResponse.json(
        { error: "chatbotId and messages are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // 1. Get chatbot info
    const { data: chatbot } = await supabase
      .from("chatbots")
      .select("system_prompt, welcome_message, name")
      .eq("id", chatbotId)
      .single();

    if (!chatbot) {
      return NextResponse.json({ error: "Chatbot not found" }, { status: 404 });
    }

    // 2. Get the latest user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m: any) => m.role === "user")?.content;

    let context = "";

    if (lastUserMessage) {
      // 3. Create embedding for the question
      const embeddingRes = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: lastUserMessage,
      });

      const queryEmbedding = embeddingRes.data[0].embedding;

      // 4. Similarity search in Supabase
      const { data: matches } = await supabase.rpc("match_embeddings", {
        query_embedding: queryEmbedding,
        match_chatbot_id: chatbotId,
        match_threshold: 0.5,
        match_count: 6,
      });

      if (matches && matches.length > 0) {
        context = matches.map((m: any) => m.content).join("\n\n---\n\n");
      }
    }

    // 5. Build system prompt with context
    const systemPrompt = `${chatbot.system_prompt}

${
  context
    ? `Use the following knowledge base to answer the user. If the answer is not in the knowledge base, politely say you don't have that information.

KNOWLEDGE BASE:
${context}`
    : "No knowledge base documents found yet. Answer helpfully but mention that more information can be added."
}`;

    // 6. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ message: reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
