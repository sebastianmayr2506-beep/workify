import { getAllQuestions } from "@/lib/actions/questions";
import { GlobalQuestionsList } from "@/components/questions/global-questions-list";

export default async function QuestionsPage() {
  const questions = await getAllQuestions().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fragen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Alle Fragen über alle Kunden hinweg.</p>
      </div>
      <GlobalQuestionsList questions={questions} />
    </div>
  );
}
