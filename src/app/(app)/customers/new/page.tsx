import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neuer Kunde</h1>
      <CustomerForm />
    </div>
  );
}
