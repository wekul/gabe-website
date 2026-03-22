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
    <section className="public-shell">
      <div className="public-layout">
        <div className="max-w-3xl">
          <p className="public-kicker">Restricted</p>
          <h1 className="public-title">Access denied.</h1>
          <p className="public-copy">
            {from
              ? `Your current role is not allowed to open the ${from} section.`
              : "Your current role does not include permission for this admin section."}
          </p>
          <div className="public-actions">
            <Link href="/admin" className="public-link">Back To Admin</Link>
            <Link href="/admin/contact-admin" className="public-link">Contact Admin</Link>
            <Link href="/" className="public-link secondary">Back To Site</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
