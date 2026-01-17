export function Alert({
  title,
  desc
}: {
  title: string;
  desc?: string;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="text-sm font-semibold text-amber-900">{title}</div>
      {desc ? <div className="mt-1 text-sm text-amber-800">{desc}</div> : null}
    </div>
  );
}

