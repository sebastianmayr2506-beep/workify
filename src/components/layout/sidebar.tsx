"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  House,
  Users,
  MessageCircleQuestion,
  LayoutTemplate,
  BarChart2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const ICON_MAP = {
  House,
  Users,
  MessageCircleQuestion,
  LayoutTemplate,
  BarChart2,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout fehlgeschlagen");
    } else {
      router.push("/auth/login");
    }
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r bg-background px-3 py-4 shrink-0">
      <Link href="/" className="px-2 mb-6 flex items-center gap-2">
        <span className="font-bold text-lg">Workify</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_LINKS.map(({ href, label, icon }) => {
          const Icon = ICON_MAP[icon as keyof typeof ICON_MAP];
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Abmelden
      </button>
    </aside>
  );
}
