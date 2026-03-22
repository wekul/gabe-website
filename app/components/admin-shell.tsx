import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AdminShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: Props) {
  return (
    <section className="w-full text-[color:var(--theme-text)]">
      <div className="w-full border-t border-[color:var(--theme-border)] bg-[radial-gradient(circle_at_var(--theme-glow-anchor-x)_var(--theme-glow-anchor-y),var(--theme-accent-soft),transparent_26%),linear-gradient(180deg,var(--theme-surface-soft),rgba(255,255,255,0.02))]">
        <div className="w-full px-5 py-8 md:px-8 md:py-10 xl:px-12 xl:py-12 2xl:px-16">
          <div className="mb-12 border-b border-[color:var(--theme-border)] pb-10">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] xl:items-end">
              <div className="max-w-5xl">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-[color:var(--theme-accent)] md:text-xs">
                  {eyebrow}
                </p>
                <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-[color:var(--theme-text)] md:text-5xl xl:text-[4.5rem]">
                  {title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-[color:var(--theme-text-muted)] xl:text-lg">
                  {description}
                </p>
              </div>
              {actions ? (
                <div className="flex flex-wrap items-center justify-start gap-3 xl:justify-end">{actions}</div>
              ) : null}
            </div>
          </div>

          <div className="space-y-10">{children}</div>
        </div>
      </div>
    </section>
  );
}
