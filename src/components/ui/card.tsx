export function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{desc}</div>
    </div>
  );
}

