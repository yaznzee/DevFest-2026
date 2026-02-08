// Generic Featherless API Client
const BASE_URL = "https://api.featherless.ai/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const callFeatherless = async (
  messages: ChatMessage[],
  model: string = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  temperature: number = 0.7
): Promise<string> => {
  const API_KEY = import.meta.env.VITE_FEATHERLESS_API_KEY as string | undefined;

  if (!API_KEY) {
    console.error("[Featherless] Missing API Key");
    throw new Error("Missing Featherless API Key");
  }

  console.log(`[Featherless] calling model ${model}...`);

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": document.title || "Raise the Bar"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: 250 // increased for judge JSON
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Featherless] Error ${response.status}: ${errText}`);
      throw new Error(`Featherless API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";

  } catch (error) {
    console.error("[Featherless] Network/Parse Error:", error);
    throw error;
  }
};
