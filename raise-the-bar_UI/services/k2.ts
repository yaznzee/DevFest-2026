import { ChatMessage } from "./featherless";

export const isK2Configured = (): boolean => {
  const apiKey = import.meta.env.VITE_K2_API_KEY as string | undefined;
  const baseUrl = import.meta.env.VITE_K2_BASE_URL as string | undefined;
  return Boolean(apiKey && baseUrl);
};

export const callK2 = async (
  messages: ChatMessage[],
  model: string = (import.meta.env.VITE_K2_MODEL as string | undefined) || "k2-think-v2",
  temperature: number = 0.7
): Promise<string> => {
  const apiKey = import.meta.env.VITE_K2_API_KEY as string | undefined;
  const baseUrl = import.meta.env.VITE_K2_BASE_URL as string | undefined;

  if (!apiKey || !baseUrl) {
    console.error("[K2] Missing API Key or Base URL");
    throw new Error("Missing K2 configuration");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 250
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[K2] Error ${response.status}: ${errText}`);
    throw new Error(`K2 API Error: ${response.status}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
};
