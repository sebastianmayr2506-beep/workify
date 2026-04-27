// AI import logic is now handled by /api/ai-import/route.ts
// This file is kept for the shared ExtractedTask type.

export interface ExtractedTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
}
