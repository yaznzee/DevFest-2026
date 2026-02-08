import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("[Supabase] Missing URL or Anon Key");
}

export const supabase = createClient(
  SUPABASE_URL || "",
  SUPABASE_ANON_KEY || ""
);

export interface TranscriptRecord {
  id: string | number;
  text: string;
  created_at: string;
  grade?: string | null;
  feedback?: string | null;
}

export const saveTranscript = async (text: string): Promise<TranscriptRecord> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase configuration");
  }

  const { data, error } = await supabase
    .from("transcripts")
    .insert({
      text,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) {
    throw error || new Error("Failed to save transcript");
  }

  return data as TranscriptRecord;
};

export const updateTranscriptGrade = async (
  id: string | number,
  grade: string,
  feedback: string
): Promise<void> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase configuration");
  }

  const { error } = await supabase
    .from("transcripts")
    .update({
      grade,
      feedback
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
};
