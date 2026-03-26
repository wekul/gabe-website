import Link from "next/link";
import EditablePageValue from "@/app/components/editable-page-value";
import HomeGallery from "@/app/components/home-gallery";
import PageContentItems from "@/app/components/page-content-items";
import PageEditLink from "@/app/components/page-edit-link";
import PageEditorBuiltInBlock from "@/app/components/page-editor-built-in-block";
import { PageEditorProvider } from "@/app/components/page-editor-provider";
import { PAGE_BUILTIN_LAYOUT_DEFAULTS } from "@/lib/page-content-shared";
import {
  canCurrentUserManagePages,
  getPageBuiltinLayout,
  getPageContent,
  getPageContentItems,
} from "@/lib/page-content";

export const dynamic = "force-dynamic";


export default async function Home() {
  const [content, layout, items, canManagePages] = await Promise.all([
    getPageContent("home"),
    getPageBuiltinLayout("home"),
    getPageContentItems("home"),
    canCurrentUserManagePages(),
  ]);

  return (
    <PageEditorProvider initialContent={content} initialLayout={layout} initialItems={items} canEdit={false}>
      <section className="home-page page-editor-home-stage">
        <div>
          <div className="page-freeform-region home-hero-freeform">
            {Array.from(PAGE_BUILTIN_LAYOUT_DEFAULTS.home.hero).map((blockKey) => {
              if (blockKey === "kicker") {
                return (
                  <PageEditorBuiltInBlock key={blockKey} pageKey="home" regionKey="hero" blockKey={blockKey} label="Eyebrow">
                    <p className="public-kicker"><EditablePageValue fieldKey="kicker" initialValue={content.kicker} /></p>
                  </PageEditorBuiltInBlock>
                );
              }
              if (blockKey === "title") {
                return (
                  <PageEditorBuiltInBlock key={blockKey} pageKey="home" regionKey="hero" blockKey={blockKey} label="Title">
                    <h1 className="home-page-text"><EditablePageValue fieldKey="title" initialValue={content.title} /></h1>
                  </PageEditorBuiltInBlock>
                );
              }
              if (blockKey === "body") {
                return (
                  <PageEditorBuiltInBlock key={blockKey} pageKey="home" regionKey="hero" blockKey={blockKey} label="Intro Copy">
                    <p className="public-copy max-w-2xl"><EditablePageValue fieldKey="body" initialValue={content.body} /></p>
                  </PageEditorBuiltInBlock>
                );
              }
              return (
                <PageEditorBuiltInBlock key={blockKey} pageKey="home" regionKey="hero" blockKey={blockKey} label="Action Links">
                  <div className="public-actions">
                    <Link href="/shop" className="public-link"><EditablePageValue fieldKey="primaryLinkLabel" initialValue={content.primaryLinkLabel} /></Link>
                    <Link href="/contact" className="public-link secondary"><EditablePageValue fieldKey="secondaryLinkLabel" initialValue={content.secondaryLinkLabel} /></Link>
                  </div>
                  <a href="#portfolio" className="home-portfolio-link pt-70">
                    <span>Portfolio</span>
                    <span className="home-portfolio-arrow" aria-hidden="true">↓</span>
                  </a>
                </PageEditorBuiltInBlock>
              );
            })}
          </div>
          <PageContentItems slotKey="hero_end" />
        </div>
      </section>

      <section id="portfolio" className="public-shell home-gallery-shell">
        <HomeGallery />
        <PageContentItems slotKey="page_end" />
      </section>

      {canManagePages ? <PageEditLink href="/admin/pages/home" /> : null}
    </PageEditorProvider>
  );
}

