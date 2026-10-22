export interface Chatbot {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  system_prompt: string;
  welcome_message: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  chatbot_id: string;
  file_name: string;
  content: string;
  created_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
