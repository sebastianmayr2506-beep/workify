"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageCircleQuestion, LayoutTemplate, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";

const ICON_MAP = {
  LayoutDashboard,
  Users,
  MessageCircleQuestion,
  LayoutTemplate,
  BarChart2,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-background z-40">
      <div className="flex items-center justify-around h-16">
        {NAV_LINKS.map(({ href, label, icon }) => {
          const Icon = ICON_MAP[icon as keyof typeof ICON_MAP];
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 min-w-[56px] transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
