"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, Loader2, FileText, Folder, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { globalSearch, type SearchResult } from "@/lib/actions/dashboard";
import { cn } from "@/lib/utils";

export interface DashboardFilterState {
  search: string;
  customerId: string;
  projectId: string;
  status: string;
  priority: string;
}

interface CustomerOption { id: string; name: string }
interface ProjectOption { id: string; name: string; customer_id: string }

interface Props {
  filters: DashboardFilterState;
  onChange: (filters: DashboardFilterState) => void;
  customers: CustomerOption[];
  projects: ProjectOption[];
}

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Arbeit",
  waiting: "Wartet",
  done: "Erledigt",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  urgent: "Dringend",
};

export function DashboardFilters({ filters, onChange, customers, projects }: Props) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchValue || searchValue.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const results = await globalSearch(searchValue);
        setSearchResults(results);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Close results on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProjects = filters.customerId
    ? projects.filter((p) => p.customer_id === filters.customerId)
    : projects;

  const hasActiveFilters =
    filters.search || filters.customerId || filters.projectId || filters.status || filters.priority;

  function reset() {
    setSearchValue("");
    onChange({ search: "", customerId: "", projectId: "", status: "", priority: "" });
  }

  const iconMap = { task: FileText, project: Folder, customer: User };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {/* Global Search */}
        <div ref={searchRef} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            placeholder="Suche Tasks, Projekte, Kunden …"
            className="h-9 pl-8 pr-8"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); setSearchResults([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {isPending && (
            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}

          {/* Results Dropdown */}
          {showResults && searchValue.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
              {searchResults.length === 0 && !isPending && (
                <p className="px-3 py-3 text-sm text-muted-foreground">Keine Treffer.</p>
              )}
              {searchResults.map((r) => {
                const Icon = iconMap[r.type];
                const typeLabels = { task: "Task", project: "Projekt", customer: "Kunde" };
                return (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={r.href}
                    onClick={() => setShowResults(false)}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{r.label}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {typeLabels[r.type]}{r.context ? ` · ${r.context}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer */}
        <Select
          value={filters.customerId}
          onValueChange={(v) => onChange({ ...filters, customerId: v ?? "", projectId: "" })}
          items={{ "": "Alle Kunden", ...Object.fromEntries(customers.map((c) => [c.id, c.name])) }}
        >
          <SelectTrigger className="h-9 min-w-[140px]">
            <SelectValue placeholder="Alle Kunden" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Kunden</SelectItem>
            {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Project */}
        <Select
          value={filters.projectId}
          onValueChange={(v) => onChange({ ...filters, projectId: v ?? "" })}
          items={{ "": "Alle Projekte", ...Object.fromEntries(filteredProjects.map((p) => [p.id, p.name])) }}
        >
          <SelectTrigger className="h-9 min-w-[140px]">
            <SelectValue placeholder="Alle Projekte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Projekte</SelectItem>
            {filteredProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v ?? "" })}
          items={{ "": "Alle Status", ...STATUS_LABELS }}
        >
          <SelectTrigger className="h-9 min-w-[120px]">
            <SelectValue placeholder="Alle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Status</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select
          value={filters.priority}
          onValueChange={(v) => onChange({ ...filters, priority: v ?? "" })}
          items={{ "": "Alle Prio", ...PRIORITY_LABELS }}
        >
          <SelectTrigger className="h-9 min-w-[120px]">
            <SelectValue placeholder="Alle Prio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Prio</SelectItem>
            {Object.entries(PRIORITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-9 gap-1" onClick={reset}>
            <X className="h-3.5 w-3.5" />
            Filter zurücksetzen
          </Button>
        )}
      </div>
    </div>
  );
}
