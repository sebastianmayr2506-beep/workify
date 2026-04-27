import Link from "next/link";
import { Plus, Archive, Mail, Phone, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCustomers } from "@/lib/actions/customers";
import { cn } from "@/lib/utils";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const customers = await getCustomers(showArchived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunden</h1>
          <p className="text-sm text-muted-foreground">{customers.length} {showArchived ? "archiviert" : "aktiv"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={showArchived ? "/customers" : "/customers?archived=1"}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Archive className="h-4 w-4 mr-1.5" />
            {showArchived ? "Aktive" : "Archivierte"}
          </Link>
          <Link href="/customers/new" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-1.5" />
            Neuer Kunde
          </Link>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">Noch keine Kunden</p>
          <p className="text-sm mt-1">Leg deinen ersten Kunden an.</p>
          <Link href="/customers/new" className={cn(buttonVariants(), "mt-4 inline-flex")}>
            <Plus className="h-4 w-4 mr-1.5" />Neuer Kunde
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="group block rounded-lg border bg-card p-4 hover:border-foreground/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold group-hover:underline line-clamp-1">{customer.name}</span>
                {customer.is_archived && <Badge variant="outline" className="text-xs shrink-0">Archiviert</Badge>}
              </div>
              {customer.primary_contact_name && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{customer.primary_contact_name}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {customer.primary_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{customer.primary_email}</span>
                  </span>
                )}
                {customer.primary_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {customer.primary_phone}
                  </span>
                )}
                {customer.awork_url && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Awork
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
