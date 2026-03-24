import ContactForm from "@/app/components/contact-form";
import EditablePageValue from "@/app/components/editable-page-value";
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

export default async function ContactPage() {
  const [content, layout, items, canManagePages] = await Promise.all([
    getPageContent("contact"),
    getPageBuiltinLayout("contact"),
    getPageContentItems("contact"),
    canCurrentUserManagePages(),
  ]);

  return (
    <PageEditorProvider initialContent={content} initialLayout={layout} initialItems={items} canEdit={false}>
      <section className="mx-auto flex min-h-[calc(100vh-var(--header-height))] w-full max-w-6xl px-4 py-10 md:px-6 xl:px-8">
        <div className="grid w-full gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1.1fr)] xl:items-start">
          <div>
            <div className="page-freeform-region contact-intro-freeform">
              {Array.from(PAGE_BUILTIN_LAYOUT_DEFAULTS.contact.intro).map((blockKey) => {
                if (blockKey === "kicker") {
                  return (
                    <PageEditorBuiltInBlock key={blockKey} pageKey="contact" regionKey="intro" blockKey={blockKey} label="Eyebrow">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--theme-accent)]">
                        <EditablePageValue fieldKey="kicker" initialValue={content.kicker} />
                      </p>
                    </PageEditorBuiltInBlock>
                  );
                }
                if (blockKey === "title") {
                  return (
                    <PageEditorBuiltInBlock key={blockKey} pageKey="contact" regionKey="intro" blockKey={blockKey} label="Title">
                      <h1 className="text-4xl font-semibold tracking-[-0.05em] text-[color:var(--theme-text)] md:text-5xl xl:text-6xl">
                        <EditablePageValue fieldKey="title" initialValue={content.title} />
                      </h1>
                    </PageEditorBuiltInBlock>
                  );
                }
                return (
                  <PageEditorBuiltInBlock key={blockKey} pageKey="contact" regionKey="intro" blockKey={blockKey} label="Intro Copy">
                    <p className="max-w-xl text-base leading-8 text-[color:var(--theme-text-muted)] md:text-lg">
                      <EditablePageValue fieldKey="body" initialValue={content.body} />
                    </p>
                  </PageEditorBuiltInBlock>
                );
              })}
            </div>
            <PageContentItems slotKey="intro_end" />
          </div>

          <div>
            <div className="page-freeform-region contact-form-freeform">
              <PageEditorBuiltInBlock pageKey="contact" regionKey="form" blockKey="submitLabel" label="Submit Button">
                <ContactForm submitLabel={content.submitLabel} submitLabelFieldKey="submitLabel" />
              </PageEditorBuiltInBlock>
            </div>
            <PageContentItems slotKey="form_end" />
          </div>
        </div>
      </section>

      {canManagePages ? <PageEditLink href="/admin/pages/contact" /> : null}
    </PageEditorProvider>
  );
}

