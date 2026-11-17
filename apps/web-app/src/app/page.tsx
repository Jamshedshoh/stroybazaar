import { LOCALES } from "@stroybazaar/shared";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold">StroyBazaar</h1>
      <p className="mt-2 text-neutral-600">Construction materials marketplace in Khujand.</p>
      <p className="mt-6 text-sm text-neutral-500">Languages: {LOCALES.join(", ")}</p>
    </main>
  );
}
