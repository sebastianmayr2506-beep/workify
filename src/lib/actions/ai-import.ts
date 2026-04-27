"use server";

export interface ExtractedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
}

const SYSTEM_PROMPT = `Du bist ein Aufgaben-Extraktions-Assistent für eine Projektmanagement-App.
Analysiere den bereitgestellten Text oder das Bild und extrahiere alle umsetzbaren Aufgaben (Tasks).

Regeln:
- Extrahiere NUR konkrete, umsetzbare Aufgaben — keine Informationen oder Beschreibungen ohne Handlungsbedarf
- Fasse ähnliche Aufgaben zusammen
- Priorität: "urgent" = sofort/kritisch, "high" = wichtig, "medium" = normal, "low" = kann warten
- Titel: kurz und prägnant (max 80 Zeichen), auf Deutsch wenn möglich
- Beschreibung: Details/Kontext aus dem Original, kann leer sein

Antworte NUR mit einem gültigen JSON-Array, kein anderer Text:
[
  {
    "title": "Aufgabentitel",
    "description": "Detailbeschreibung oder leer",
    "priority": "medium"
  }
]`;

function parseGeminiResponse(raw: string): ExtractedTask[] {
  const jsonMatch = raw.trim().match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini hat kein gültiges JSON zurückgegeben.");
  return JSON.parse(jsonMatch[0]) as ExtractedTask[];
}

export async function extractTasksFromText(text: string): Promise<ExtractedTask[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY nicht konfiguriert.");

  try {
    // Dynamic import prevents top-level module issues in the server bundle
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      SYSTEM_PROMPT,
      "\n\nZu analysierender Text:\n",
      text,
    ]);

    return parseGeminiResponse(result.response.text());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`KI-Analyse fehlgeschlagen: ${msg}`);
  }
}

export async function extractTasksFromImage(
  base64Data: string,
  mimeType: string,
  extraText?: string
): Promise<ExtractedTask[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY nicht konfiguriert.");

  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const parts: Parameters<typeof model.generateContent>[0] = [
      SYSTEM_PROMPT,
      ...(extraText ? ["\n\nZusätzlicher Kontext: " + extraText] : []),
      { inlineData: { data: base64Data, mimeType } },
    ];

    const result = await model.generateContent(parts);
    return parseGeminiResponse(result.response.text());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`KI-Analyse fehlgeschlagen: ${msg}`);
  }
}
