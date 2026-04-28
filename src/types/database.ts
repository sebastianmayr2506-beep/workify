// Auto-generated placeholder — replace with:
// pnpm dlx supabase@latest gen types typescript --project-id nrrijqoqigtqztqxmefu > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; settings: Json | null; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; settings?: Json | null; created_at?: string; updated_at?: string };
        Update: { display_name?: string | null; settings?: Json | null; updated_at?: string };
        Relationships: [];
      };
      customers: {
        Row: { id: string; user_id: string; name: string; primary_contact_name: string | null; primary_email: string | null; primary_phone: string | null; awork_url: string | null; extra_links: Json | null; notes: string | null; is_archived: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; name: string; primary_contact_name?: string | null; primary_email?: string | null; primary_phone?: string | null; awork_url?: string | null; extra_links?: Json | null; notes?: string | null; is_archived?: boolean; created_at?: string; updated_at?: string };
        Update: { name?: string; primary_contact_name?: string | null; primary_email?: string | null; primary_phone?: string | null; awork_url?: string | null; extra_links?: Json | null; notes?: string | null; is_archived?: boolean; updated_at?: string };
        Relationships: [];
      };
      projects: {
        Row: { id: string; user_id: string; customer_id: string; name: string; description: string | null; status: Database["public"]["Enums"]["project_status"]; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; customer_id: string; name: string; description?: string | null; status?: Database["public"]["Enums"]["project_status"]; created_at?: string; updated_at?: string };
        Update: { name?: string; description?: string | null; status?: Database["public"]["Enums"]["project_status"]; updated_at?: string };
        Relationships: [{ foreignKeyName: "projects_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }];
      };
      tasks: {
        Row: { id: string; user_id: string; customer_id: string; project_id: string | null; title: string; description: string | null; status: Database["public"]["Enums"]["task_status"]; priority: Database["public"]["Enums"]["task_priority"]; due_date: string | null; half_billing: boolean; source: Database["public"]["Enums"]["task_source"]; source_meta: Json | null; completed_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; customer_id: string; project_id?: string | null; title: string; description?: string | null; status?: Database["public"]["Enums"]["task_status"]; priority?: Database["public"]["Enums"]["task_priority"]; due_date?: string | null; half_billing?: boolean; source?: Database["public"]["Enums"]["task_source"]; source_meta?: Json | null; completed_at?: string | null; created_at?: string; updated_at?: string };
        Update: { title?: string; description?: string | null; project_id?: string | null; status?: Database["public"]["Enums"]["task_status"]; priority?: Database["public"]["Enums"]["task_priority"]; due_date?: string | null; half_billing?: boolean; source_meta?: Json | null; completed_at?: string | null; updated_at?: string };
        Relationships: [{ foreignKeyName: "tasks_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }, { foreignKeyName: "tasks_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "projects"; referencedColumns: ["id"] }];
      };
      time_entries: {
        Row: { id: string; user_id: string; task_id: string; started_at: string; ended_at: string | null; note: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; task_id: string; started_at: string; ended_at?: string | null; note?: string | null; created_at?: string; updated_at?: string };
        Update: { started_at?: string; ended_at?: string | null; note?: string | null; updated_at?: string };
        Relationships: [{ foreignKeyName: "time_entries_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] }];
      };
      task_notes: {
        Row: { id: string; user_id: string; task_id: string; content: string; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; task_id: string; content: string; created_at?: string; updated_at?: string };
        Update: { content?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "task_notes_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] }];
      };
      meetings: {
        Row: { id: string; user_id: string; customer_id: string; title: string; meeting_date: string; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; customer_id: string; title: string; meeting_date: string; notes?: string | null; created_at?: string; updated_at?: string };
        Update: { title?: string; meeting_date?: string; notes?: string | null; updated_at?: string };
        Relationships: [{ foreignKeyName: "meetings_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }];
      };
      questions: {
        Row: { id: string; user_id: string; customer_id: string; task_id: string | null; meeting_id: string | null; direction: Database["public"]["Enums"]["question_direction"]; assigned_to: string | null; question: string; answer: string | null; status: Database["public"]["Enums"]["question_status"]; ask_at_next_meeting: boolean; asked_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; customer_id: string; task_id?: string | null; meeting_id?: string | null; direction?: Database["public"]["Enums"]["question_direction"]; assigned_to?: string | null; question: string; answer?: string | null; status?: Database["public"]["Enums"]["question_status"]; ask_at_next_meeting?: boolean; asked_at?: string | null; created_at?: string; updated_at?: string };
        Update: { task_id?: string | null; meeting_id?: string | null; direction?: Database["public"]["Enums"]["question_direction"]; assigned_to?: string | null; question?: string; answer?: string | null; status?: Database["public"]["Enums"]["question_status"]; ask_at_next_meeting?: boolean; asked_at?: string | null; updated_at?: string };
        Relationships: [{ foreignKeyName: "questions_customer_id_fkey"; columns: ["customer_id"]; isOneToOne: false; referencedRelation: "customers"; referencedColumns: ["id"] }, { foreignKeyName: "questions_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] }];
      };
      meeting_tasks: {
        Row: { meeting_id: string; task_id: string };
        Insert: { meeting_id: string; task_id: string };
        Update: { meeting_id?: string; task_id?: string };
        Relationships: [{ foreignKeyName: "meeting_tasks_meeting_id_fkey"; columns: ["meeting_id"]; isOneToOne: false; referencedRelation: "meetings"; referencedColumns: ["id"] }, { foreignKeyName: "meeting_tasks_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] }];
      };
      task_checklist_items: {
        Row: { id: string; user_id: string; task_id: string; content: string; is_done: boolean; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; task_id: string; content: string; is_done?: boolean; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { content?: string; is_done?: boolean; sort_order?: number; updated_at?: string };
        Relationships: [{ foreignKeyName: "task_checklist_items_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "tasks"; referencedColumns: ["id"] }];
      };
      task_templates: {
        Row: { id: string; user_id: string; name: string; default_title: string | null; default_description: string | null; default_priority: Database["public"]["Enums"]["task_priority"] | null; default_customer_id: string | null; default_project_id: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; name: string; default_title?: string | null; default_description?: string | null; default_priority?: Database["public"]["Enums"]["task_priority"] | null; default_customer_id?: string | null; default_project_id?: string | null; created_at?: string; updated_at?: string };
        Update: { name?: string; default_title?: string | null; default_description?: string | null; default_priority?: Database["public"]["Enums"]["task_priority"] | null; default_customer_id?: string | null; default_project_id?: string | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      task_status: "open" | "in_progress" | "waiting" | "done";
      task_priority: "low" | "medium" | "high" | "urgent";
      task_source: "manual" | "ai_import" | "template";
      project_status: "planned" | "active" | "on_hold" | "done";
      question_direction: "internal" | "customer";
      question_status: "open" | "answered" | "wont_answer";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
