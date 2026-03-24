"use client";

import EditablePageValue from "@/app/components/editable-page-value";
import EditablePageRegion from "@/app/components/editable-page-region";
import PageContentItems from "@/app/components/page-content-items";
import ShopCardImage from "@/app/components/shop-card-image";
import ContactFormPreview from "@/app/components/contact-form-preview";
import PageEditorBuiltInBlock from "@/app/components/page-editor-built-in-block";
import type { PageKey } from "@/lib/page-content-shared";

type ShopItemPreview = {
  id: string;
  title: string;
  imageUrl: string;
  costPence: number;
  deliveryType: "post" | "digital";
  quantityTracked: boolean;
  quantity?: number | null;
};

type Props = {
  pageKey: PageKey;
  initialContent: Record<string, string>;
  shopItems?: ShopItemPreview[];
};

function formatPrice(costPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(costPence / 100);
}

function getBadgeText(item: ShopItemPreview) {
  if (item.deliveryType === "digital") {
    return "Digital Edition";
  }

  if (item.quantityTracked && (!item.quantity || item.quantity < 3)) {
    return "Limited Stock";
  }

  return "Available Now";
}

export default function PageEditorCanvas({ pageKey, initialContent, shopItems = [] }: Props) {
  if (pageKey === "home") {
    return (
      <>
        <section className="home-page">
          <div>
            <EditablePageRegion label="Hero" className="page-editor-live-region">
              <PageEditorBuiltInBlock pageKey="home" regionKey="hero" blockKey="kicker" label="Eyebrow">
                <p className="public-kicker"><EditablePageValue fieldKey="kicker" initialValue={initialContent.kicker} /></p>
              </PageEditorBuiltInBlock>
              <PageEditorBuiltInBlock pageKey="home" regionKey="hero" blockKey="title" label="Title">
                <h1 className="home-page-text"><EditablePageValue fieldKey="title" initialValue={initialContent.title} /></h1>
              </PageEditorBuiltInBlock>
              <PageEditorBuiltInBlock pageKey="home" regionKey="hero" blockKey="body" label="Intro Copy">
                <p className="public-copy max-w-2xl"><EditablePageValue fieldKey="body" initialValue={initialContent.body} /></p>
              </PageEditorBuiltInBlock>
              <PageEditorBuiltInBlock pageKey="home" regionKey="hero" blockKey="actions" label="Action Links">
                <div className="public-actions">
                  <span className="public-link"><EditablePageValue fieldKey="primaryLinkLabel" initialValue={initialContent.primaryLinkLabel} /></span>
                  <span className="public-link secondary"><EditablePageValue fieldKey="secondaryLinkLabel" initialValue={initialContent.secondaryLinkLabel} /></span>
                </div>
              </PageEditorBuiltInBlock>
            </EditablePageRegion>
            <PageContentItems slotKey="hero_end" />
          </div>
        </section>

        <section className="public-shell">
          <PageContentItems slotKey="page_end" />
        </section>
      </>
    );
  }

  if (pageKey === "contact") {
    return (
      <section className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full max-w-6xl px-4 py-10 md:px-6 xl:px-8">
        <div className="grid w-full gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] xl:items-start">
          <div className="pt-2">
            <EditablePageRegion label="Intro" className="page-editor-live-region">
              <PageEditorBuiltInBlock pageKey="contact" regionKey="intro" blockKey="kicker" label="Eyebrow">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--theme-accent)]">
                  <EditablePageValue fieldKey="kicker" initialValue={initialContent.kicker} />
                </p>
              </PageEditorBuiltInBlock>
              <PageEditorBuiltInBlock pageKey="contact" regionKey="intro" blockKey="title" label="Title">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[color:var(--theme-text)] md:text-5xl xl:text-6xl">
                  <EditablePageValue fieldKey="title" initialValue={initialContent.title} />
                </h1>
              </PageEditorBuiltInBlock>
              <PageEditorBuiltInBlock pageKey="contact" regionKey="intro" blockKey="body" label="Intro Copy">
                <p className="max-w-xl text-base leading-8 text-[color:var(--theme-text-muted)] md:text-lg">
                  <EditablePageValue fieldKey="body" initialValue={initialContent.body} />
                </p>
              </PageEditorBuiltInBlock>
            </EditablePageRegion>
            <PageContentItems slotKey="intro_end" />
          </div>

          <div>
            <EditablePageRegion label="Form" className="page-editor-live-region">
              <PageEditorBuiltInBlock pageKey="contact" regionKey="form" blockKey="submitLabel" label="Submit Button">
                <ContactFormPreview submitLabel={initialContent.submitLabel} submitLabelFieldKey="submitLabel" />
              </PageEditorBuiltInBlock>
            </EditablePageRegion>
            <PageContentItems slotKey="form_end" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="public-shell !max-w-none">
      <div className="public-panel w-full text-[color:var(--theme-text)]">
        <div className="mx-auto w-full max-w-[120rem] px-1 md:px-3">
          <EditablePageRegion label="Shop Header" className="page-editor-live-region mb-10">
            <PageEditorBuiltInBlock pageKey="shop" regionKey="header" blockKey="kicker" label="Eyebrow">
              <p className="public-kicker !mb-3"><EditablePageValue fieldKey="kicker" initialValue={initialContent.kicker} /></p>
            </PageEditorBuiltInBlock>
            <PageEditorBuiltInBlock pageKey="shop" regionKey="header" blockKey="title" label="Title">
              <h2 className="max-w-[10ch] text-4xl font-semibold tracking-[-0.05em] text-[color:var(--theme-text)] md:text-5xl xl:text-6xl">
                <EditablePageValue fieldKey="title" initialValue={initialContent.title} />
              </h2>
            </PageEditorBuiltInBlock>
          </EditablePageRegion>

          <PageContentItems slotKey="header_end" />

          {shopItems.length === 0 ? (
            <EditablePageRegion label="Empty State" className="page-editor-live-region">
              <PageEditorBuiltInBlock pageKey="shop" regionKey="empty" blockKey="emptyState" label="Empty State">
                <p className="mx-auto max-w-2xl text-center text-base leading-8 text-[color:var(--theme-text-muted)]">
                  <EditablePageValue fieldKey="emptyState" initialValue={initialContent.emptyState} />
                </p>
              </PageEditorBuiltInBlock>
            </EditablePageRegion>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {shopItems.map((item) => (
                <article key={item.id} className="group block text-center">
                  <div className="relative overflow-hidden rounded-[1.6rem] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] p-3 shadow-[0_20px_60px_color-mix(in_srgb,var(--theme-shadow)_18%,transparent)] transition-transform duration-200 group-hover:-translate-y-1">
                    <div className="absolute left-6 top-6 z-10 rounded-full border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-strong-soft)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--theme-text)] shadow-[0_4px_12px_color-mix(in_srgb,var(--theme-shadow)_12%,transparent)]">
                      {getBadgeText(item)}
                    </div>
                    <div className="overflow-hidden rounded-[1.25rem] bg-[color:var(--theme-surface-strong-soft)]">
                      <ShopCardImage
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-[26rem] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] md:h-[32rem] xl:h-[34rem]"
                      />
                    </div>
                  </div>

                  <div className="px-3 pb-2 pt-5">
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--theme-text)] underline decoration-[color:var(--theme-accent)] underline-offset-[0.16em]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xl font-semibold text-[color:var(--theme-accent)]">
                      {formatPrice(item.costPence)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          <PageContentItems slotKey="grid_end" />
        </div>
      </div>
    </section>
  );
}
