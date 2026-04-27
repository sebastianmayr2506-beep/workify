import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/actions/customers";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id).catch(() => null);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Kunde bearbeiten</h1>
      <CustomerForm
        customerId={id}
        defaultValues={{
          name: customer.name,
          primary_contact_name: customer.primary_contact_name ?? undefined,
          primary_email: customer.primary_email ?? undefined,
          primary_phone: customer.primary_phone ?? undefined,
          awork_url: customer.awork_url ?? undefined,
          extra_links: (customer.extra_links as { label: string; url: string }[]) ?? [],
          notes: customer.notes ?? undefined,
        }}
      />
    </div>
  );
}
