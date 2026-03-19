import Link from "next/link";

type Props = {
  href?: string;
  label?: string;
};

export default function AdminBackLink({
  href = "/admin",
  label = "Back to Admin",
}: Props) {
  return (
    <Link href={href} className="theme-action-link text-sm font-medium">
      <span aria-hidden="true">&larr;</span>
      <span>{label}</span>
    </Link>
  );
}
