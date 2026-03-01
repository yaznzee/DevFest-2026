const BASE_URL = "https://api.elevenlabs.io/v1/speech-to-text";

export const transcribeWithElevenLabs = async (
  audioBlob: Blob,
  fallbackText: string = ""
): Promise<string> => {
  const apiKey = import.meta.env.VITE_ELEVEN_LABS_API_KEY as string | undefined;

  if (!apiKey) {
    console.error("[ElevenLabs] Missing API Key");
    throw new Error("Missing ElevenLabs API Key");
  }

  const form = new FormData();
  form.append("model_id", "scribe_v1");
  form.append("file", audioBlob, "recording.webm");
  form.append("language_code", "en");

  let text = "";

  try {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey
      },
      body: form
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ElevenLabs] Error ${response.status}: ${errText}`);
      throw new Error(`ElevenLabs API Error: ${response.status}`);
    }

    const data = await response.json();
    text = (data?.text as string | undefined) || "";
  } catch (e) {
    console.warn("[ElevenLabs] transcription failed, falling back to live transcript", e);
  }

  // if ElevenLabs returned very little or nothing, fall back to the
  // interim speech recognition captured with Web Speech API (live transcript)
  if (!text.trim() && fallbackText.trim()) {
    return fallbackText;
  }

  return text;
};
