"use client";

import { useState, useTransition, useRef } from "react";
import { Check, X, Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
  type ChecklistItem,
} from "@/lib/actions/checklist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  taskId: string;
  initialItems: ChecklistItem[];
}

function SortableRow({
  item,
  onToggle,
  onSave,
  onDelete,
  pending,
}: {
  item: ChecklistItem;
  onToggle: (id: string, isDone: boolean) => void;
  onSave: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);

  const style = { transform: CSS.Transform.toString(transform), transition };

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(item.content);
      setEditing(false);
      return;
    }
    if (trimmed !== item.content) onSave(item.id, trimmed);
    setEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md py-1.5 px-1 hover:bg-muted/50 group transition-colors",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
        title="Verschieben"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.is_done)}
        disabled={pending}
        className={cn(
          "shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
          item.is_done
            ? "bg-green-600 border-green-600 text-white"
            : "border-muted-foreground/40 hover:border-foreground"
        )}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : item.is_done ? (
          <Check className="h-3 w-3" strokeWidth={3} />
        ) : null}
      </button>

      {/* Content */}
      {editing ? (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setDraft(item.content); setEditing(false); }
          }}
          autoFocus
          className="h-7 text-sm flex-1"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={cn(
            "flex-1 text-sm text-left py-0.5",
            item.is_done && "line-through text-muted-foreground"
          )}
        >
          {item.content}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        disabled={pending}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors shrink-0"
        title="Löschen"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Checklist({ taskId, initialItems }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function setPending(id: string, on: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleAdd() {
    const trimmed = newContent.trim();
    if (!trimmed) {
      setAdding(false);
      return;
    }
    setNewContent("");
    startTransition(async () => {
      try {
        const created = await createChecklistItem(taskId, trimmed);
        setItems((prev) => [...prev, created]);
        // Keep adding mode open & focus for rapid entry
        setTimeout(() => inputRef.current?.focus(), 0);
      } catch {
        toast.error("Fehler beim Hinzufügen.");
      }
    });
  }

  function handleToggle(id: string, isDone: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_done: isDone } : i)));
    setPending(id, true);
    startTransition(async () => {
      try {
        await toggleChecklistItem(id, taskId, isDone);
      } catch {
        toast.error("Fehler.");
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_done: !isDone } : i)));
      } finally {
        setPending(id, false);
      }
    });
  }

  function handleSave(id: string, content: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, content } : i)));
    setPending(id, true);
    startTransition(async () => {
      try {
        await updateChecklistItem(id, taskId, content);
      } catch {
        toast.error("Fehler beim Speichern.");
      } finally {
        setPending(id, false);
      }
    });
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      try {
        await deleteChecklistItem(id, taskId);
      } catch {
        toast.error("Fehler beim Löschen.");
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setItems(reordered);

    startTransition(async () => {
      try {
        await reorderChecklistItems(taskId, reordered.map((i) => i.id));
      } catch {
        toast.error("Fehler beim Sortieren.");
      }
    });
  }

  const doneCount = items.filter((i) => i.is_done).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="rounded-lg border p-3 space-y-2">
      {/* Progress */}
      {total > 0 && (
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
            {doneCount}/{total}
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress === 100 ? "bg-green-500" : "bg-blue-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{progress}%</span>
        </div>
      )}

      {/* Items */}
      {items.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-0.5">
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  onToggle={handleToggle}
                  onSave={handleSave}
                  onDelete={handleDelete}
                  pending={pendingIds.has(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add new */}
      {adding ? (
        <div className="flex items-center gap-2 px-1 pl-7">
          <Input
            ref={inputRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") { setNewContent(""); setAdding(false); }
            }}
            placeholder="Schritt eingeben (Enter zum Speichern, ESC zum Abbrechen) …"
            autoFocus
            className="h-7 text-sm"
          />
          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setNewContent(""); setAdding(false); }}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1.5 text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Schritt hinzufügen
        </Button>
      )}

      {items.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground italic px-1">
          Keine Schritte. Füge Unteraufgaben hinzu, um den Task aufzuteilen.
        </p>
      )}
    </div>
  );
}
