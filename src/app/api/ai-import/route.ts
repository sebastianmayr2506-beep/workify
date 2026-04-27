import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

export async function POST(req: NextRequest) {
  // Auth check
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Auth-Fehler" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_GEMINI_API_KEY nicht konfiguriert" }, { status: 500 });
  }

  let body: { text?: string; imageBase64?: string; mimeType?: string; extraContext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
    { text: SYSTEM_PROMPT },
  ];

  if (body.extraContext) {
    parts.push({ text: "\n\nZusätzlicher Kontext: " + body.extraContext });
  }

  if (body.imageBase64) {
    parts.push({ inlineData: { mimeType: body.mimeType ?? "image/jpeg", data: body.imageBase64 } });
  } else if (body.text) {
    parts.push({ text: "\n\nZu analysierender Text:\n" + body.text });
  } else {
    return NextResponse.json({ error: "Kein Text oder Bild angegeben" }, { status: 400 });
  }

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    });
  } catch (err) {
    return NextResponse.json({ error: `Netzwerkfehler: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => geminiRes.statusText);
    // Try to extract a clean message from Gemini's error JSON
    let cleanMsg = errText;
    try {
      const parsed = JSON.parse(errText) as { error?: { message?: string; status?: string } };
      if (parsed.error?.message) {
        const firstLine = parsed.error.message.split("\n")[0].trim();
        cleanMsg = parsed.error.status ? `${parsed.error.status}: ${firstLine}` : firstLine;
      }
    } catch {
      // Fall back to raw text, truncated
      if (cleanMsg.length > 300) cleanMsg = cleanMsg.slice(0, 300) + "…";
    }
    return NextResponse.json(
      { error: `Gemini API Fehler ${geminiRes.status} (Modell ${GEMINI_MODEL}): ${cleanMsg}` },
      { status: 502 }
    );
  }

  const geminiJson = await geminiRes.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message: string };
  };

  if (geminiJson.error) {
    return NextResponse.json({ error: `Gemini: ${geminiJson.error.message}` }, { status: 502 });
  }

  const raw = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = raw.trim().match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return NextResponse.json({ error: `Gemini antwortete mit ungültigem Format: ${raw.slice(0, 200)}` }, { status: 502 });
  }

  try {
    const tasks = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: "JSON-Parsing fehlgeschlagen" }, { status: 502 });
  }
}
