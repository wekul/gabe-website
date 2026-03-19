import Link from "next/link";

type Props = {
  searchParams?: Promise<{ from?: string }>;
};

function formatSectionName(value: string) {
  return value
    .split(/[\-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function UnauthorisedPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const from = params?.from ? formatSectionName(params.from) : null;

  return (
    <section className="page-shell max-w-3xl">
      <div className="page-panel max-w-3xl text-left">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-red-300">Unauthorised</p>
        <h1 className="mb-4 text-4xl font-semibold text-white">You do not have access to this admin page.</h1>
        <p className="mb-6 text-[color:var(--theme-text-muted)]">
          {from
            ? `Your current role is not allowed to open the ${from} section.`
            : "Your current role does not include permission for this admin section."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin" className="theme-action-link text-sm font-medium">
            Back To Admin
          </Link>
          <Link
            href="/admin/contact-admin"
            className="inline-flex items-center rounded-full bg-red-300 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-red-200"
          >
            Contact Admin
          </Link>
          <Link href="/" className="theme-action-link text-sm font-medium">
            Back To Site
          </Link>
        </div>
      </div>
    </section>
  );
}
