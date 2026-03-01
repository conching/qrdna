import { CardForm } from "@/components/cards/card-form";

export const metadata = { title: "New business card — QR DNA" };

export default function NewCardPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create business card</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Design your digital business card with a public shareable link.
        </p>
      </div>
      <CardForm />
    </div>
  );
}
