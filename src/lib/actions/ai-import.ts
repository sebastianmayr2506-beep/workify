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

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

async function callGemini(
  parts: { text?: string; inlineData?: { mimeType: string; data: string } }[]
): Promise<ExtractedTask[]> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GEMINI_API_KEY nicht konfiguriert.");

  const body = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
  };

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini API Fehler ${res.status}: ${errText}`);
  }

  const json = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = raw.trim().match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Gemini hat kein gültiges JSON zurückgegeben.");
  return JSON.parse(jsonMatch[0]) as ExtractedTask[];
}

export async function extractTasksFromText(text: string): Promise<ExtractedTask[]> {
  try {
    return await callGemini([
      { text: SYSTEM_PROMPT },
      { text: "\n\nZu analysierender Text:\n" + text },
    ]);
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
  try {
    const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
      { text: SYSTEM_PROMPT },
      ...(extraText ? [{ text: "\n\nZusätzlicher Kontext: " + extraText }] : []),
      { inlineData: { mimeType, data: base64Data } },
    ];
    return await callGemini(parts);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`KI-Analyse fehlgeschlagen: ${msg}`);
  }
}
