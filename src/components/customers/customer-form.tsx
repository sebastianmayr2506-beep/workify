"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { createCustomer, updateCustomer, type CustomerFormData } from "@/lib/actions/customers";

interface ExtraLink { label: string; url: string }

interface Props {
  customerId?: string;
  defaultValues?: Partial<CustomerFormData>;
}

export function CustomerForm({ customerId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [contactName, setContactName] = useState(defaultValues?.primary_contact_name ?? "");
  const [email, setEmail] = useState(defaultValues?.primary_email ?? "");
  const [phone, setPhone] = useState(defaultValues?.primary_phone ?? "");
  const [aworkUrl, setAworkUrl] = useState(defaultValues?.awork_url ?? "");
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");
  const [extraLinks, setExtraLinks] = useState<ExtraLink[]>(
    (defaultValues?.extra_links as ExtraLink[]) ?? []
  );

  function addLink() { setExtraLinks((l) => [...l, { label: "", url: "" }]); }
  function removeLink(i: number) { setExtraLinks((l) => l.filter((_, idx) => idx !== i)); }
  function updateLink(i: number, field: keyof ExtraLink, value: string) {
    setExtraLinks((l) => l.map((link, idx) => idx === i ? { ...link, [field]: value } : link));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data: CustomerFormData = {
        name: name.trim(),
        primary_contact_name: contactName || undefined,
        primary_email: email || undefined,
        primary_phone: phone || undefined,
        awork_url: aworkUrl || undefined,
        extra_links: extraLinks.filter((l) => l.label && l.url),
        notes: notes || undefined,
      };
      if (customerId) {
        await updateCustomer(customerId, data);
        toast.success("Kunde gespeichert.");
        router.push(`/customers/${customerId}`);
      } else {
        const customer = await createCustomer(data);
        toast.success("Kunde angelegt.");
        router.push(`/customers/${customer.id}`);
      }
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
      </div>

      <Separator />
      <p className="text-sm font-medium text-muted-foreground">Hauptkontakt</p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="z.B. Anna Müller" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </div>

      <Separator />
      <p className="text-sm font-medium text-muted-foreground">Links</p>

      <div className="space-y-2">
        <Label htmlFor="awork">Awork-URL</Label>
        <Input id="awork" type="url" value={aworkUrl} onChange={(e) => setAworkUrl(e.target.value)} placeholder="https://app.awork.com/…" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Weitere Links</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addLink}>
            <Plus className="h-4 w-4 mr-1" /> Link hinzufügen
          </Button>
        </div>
        {extraLinks.map((link, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="Label" value={link.label} onChange={(e) => updateLink(i, "label", e.target.value)} className="w-32 shrink-0" />
            <Input placeholder="https://…" type="url" value={link.url} onChange={(e) => updateLink(i, "url", e.target.value)} />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(i)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="notes">Notizen</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Interne Notizen zum Kunden …" />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>{loading ? "Speichern …" : "Speichern"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </form>
  );
}
