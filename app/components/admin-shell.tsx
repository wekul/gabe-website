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
    <section className="mx-auto w-full max-w-6xl px-4 py-8 text-[color:var(--theme-text)] md:px-6">
      <div className="theme-panel overflow-hidden p-5 md:p-7">
        <div className="mb-8 border-b border-[color:var(--theme-border)] pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--theme-accent)]">
                {eyebrow}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--theme-text)] md:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[color:var(--theme-text-muted)] md:text-base">
                {description}
              </p>
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
          </div>
        </div>

        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
}
