const sections = ["Suppliers", "Products", "Orders", "RFQs"];

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {sections.map((section) => (
          <div key={section} className="rounded-lg border border-neutral-200 p-4">
            <h2 className="font-medium">{section}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}
