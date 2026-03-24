"use client";

import { Button, Input, Switch, Textarea } from "@heroui/react";
import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ImageSpotlightRecord, SiteThemeRecord } from "@/lib/site-data";
import {
  THEME_PRESETS,
  buildThemeCssVariables,
  type ThemeBackgroundStyle,
} from "@/lib/theme";
import { adminFetch } from "@/app/components/admin-session-client";

type Props = {
  initialTheme: SiteThemeRecord;
  initialImageSpotlights: ImageSpotlightRecord[];
};

type ColorThemeField = {
  key: Exclude<keyof SiteThemeRecord, "backgroundStyle" | "gradientDirection" | "gradientIntensity" | "pageEditorBetaEnabled" | "announcementEnabled" | "announcementText">;
  label: string;
  description: string;
};

const backgroundStyleOptions: {
  value: ThemeBackgroundStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "studio_gradient",
    label: "Studio Gradient",
    description: "Dark gradient with a gallery-style glow.",
  },
  {
    value: "canvas",
    label: "Canvas",
    description: "Warm primed-canvas weave across the full background.",
  },
  {
    value: "gallery_paper",
    label: "Gallery Paper",
    description: "Lighter exhibition-paper surface with subtle grain.",
  },
  {
    value: "nocturne_grid",
    label: "Nocturne Grid",
    description: "Dark background with a restrained editorial grid.",
  },
];

const colorThemeFields: ColorThemeField[] = [
  {
    key: "gradientStart",
    label: "Gradient Start",
    description: "Top-left anchor for the site background.",
  },
  {
    key: "gradientEnd",
    label: "Gradient End",
    description: "Lower-depth background tone for the whole site.",
  },
  {
    key: "accent",
    label: "Accent",
    description: "Interactive highlight used for emphasis and underlines.",
  },
  {
    key: "surface",
    label: "Surface",
    description: "Primary panel color used across cards and overlays.",
  },
  {
    key: "surfaceStrong",
    label: "Surface Strong",
    description: "Deeper panel tone for layered admin surfaces.",
  },
  {
    key: "text",
    label: "Text",
    description: "Primary site text color.",
  },
  {
    key: "mutedText",
    label: "Muted Text",
    description: "Secondary text color for supporting copy.",
  },
];

const fieldClassNames = {
  inputWrapper:
    "rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] data-[hover=true]:bg-[color:var(--theme-surface-soft)] group-data-[focus=true]:border-[color:var(--theme-accent-strong)] group-data-[focus=true]:bg-[color:var(--theme-surface-soft)]",
  input: "![color:var(--theme-text)] caret-[color:var(--theme-text)] uppercase",
  innerWrapper: "![color:var(--theme-text)]",
  label: "!text-[color:var(--theme-text-soft)]",
  description: "text-[color:var(--theme-text-muted)]",
};

const numericFieldClassNames = {
  ...fieldClassNames,
  input: "![color:var(--theme-text)] caret-[color:var(--theme-text)]",
};

function applyThemeToDocument(theme: SiteThemeRecord) {
  const variables = buildThemeCssVariables(theme);

  for (const [key, value] of Object.entries(variables)) {
    document.body.style.setProperty(key, value);
    document.documentElement.style.setProperty(key, value);
  }
}

export default function AdminThemeManagement({
  initialTheme,
  initialImageSpotlights,
}: Props) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [imageSpotlights, setImageSpotlights] = useState(initialImageSpotlights);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [busyImageId, setBusyImageId] = useState<string | null>(null);

  const previewVariables = useMemo(
    () => buildThemeCssVariables(theme) as CSSProperties,
    [theme],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      const response = await adminFetch("/api/admin/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });

      const data = (await response.json()) as {
        error?: string;
        theme?: SiteThemeRecord;
      };

      if (!response.ok || !data.theme) {
        setStatusMessage(data.error ?? "Failed to save theme.");
        return;
      }

      setTheme(data.theme);
      applyThemeToDocument(data.theme);
      router.refresh();
      setStatusMessage("Theme saved.");
    } catch {
      setStatusMessage("Failed to save theme.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleImageSpotlight = async (imageId: string, enabled: boolean) => {
    setStatusMessage("");
    setBusyImageId(imageId);

    try {
      const response = await adminFetch("/api/admin/theme/spotlights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId, enabled }),
      });

      const data = (await response.json()) as {
        error?: string;
        spotlight?: ImageSpotlightRecord;
      };

      if (!response.ok || !data.spotlight) {
        setStatusMessage(data.error ?? "Failed to update spotlight.");
        return;
      }

      setImageSpotlights((current) =>
        current.map((item) => (item.imageId === imageId ? data.spotlight! : item)),
      );
      setStatusMessage(`${data.spotlight.label} spotlight ${enabled ? "enabled" : "disabled"}.`);
    } catch {
      setStatusMessage("Failed to update spotlight.");
    } finally {
      setBusyImageId(null);
    }
  };

  return (
    <section className="theme-subpanel rounded-[1.75rem] p-5 text-[color:var(--theme-text)] md:p-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--theme-accent)]">
            Visual System
          </p>
          <h3 className="text-2xl font-semibold tracking-tight text-[color:var(--theme-text)]">Theme Controls</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
            Persist a single site theme, switch between full-background styles, and manage per-image spotlight states from one place.
          </p>
        </div>
        {statusMessage ? (
          <div className="theme-status-pill rounded-full px-4 py-2 text-sm text-[color:var(--theme-text-soft)]">
            {statusMessage}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="theme-card rounded-[1.25rem] p-4 md:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
                Presets
              </p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                Apply a complete preset, then adjust individual colors or gradient behavior if needed.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`rounded-[1.15rem] border p-4 text-left transition ${
                    theme.backgroundStyle === preset.values.backgroundStyle &&
                    theme.gradientStart === preset.values.gradientStart &&
                    theme.gradientEnd === preset.values.gradientEnd
                      ? "border-[color:var(--theme-accent-strong)] bg-[color:var(--theme-accent-soft)]"
                      : "border-[color:var(--theme-border)] bg-[rgba(255,255,255,0.03)]"
                  }`}
                  onClick={() => {
                    setTheme({ ...preset.values });
                    setStatusMessage(`${preset.label} applied. Save to persist it.`);
                  }}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text)]">
                    {preset.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="theme-card rounded-[1.25rem] p-4 md:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
                Background Style
              </p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                Control the full-page surface treatment independently from the color palette.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {backgroundStyleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`rounded-[1.15rem] border p-4 text-left transition ${
                    theme.backgroundStyle === option.value
                      ? "border-[color:var(--theme-accent-strong)] bg-[color:var(--theme-accent-soft)]"
                      : "border-[color:var(--theme-border)] bg-[rgba(255,255,255,0.03)]"
                  }`}
                  onClick={() => {
                    setTheme((current) => ({ ...current, backgroundStyle: option.value }));
                  }}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text)]">
                    {option.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--theme-text-muted)]">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="theme-card rounded-[1.25rem] p-4 md:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
                Gradient Behavior
              </p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                Change the background angle and the overall strength of the gradient glow.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Input
                  label="Direction"
                  type="number"
                  min={0}
                  max={359}
                  description="Degrees. 0 is up, 90 is right, 180 is down."
                  value={String(theme.gradientDirection)}
                  classNames={numericFieldClassNames}
                  onValueChange={(value) => {
                    setTheme((current) => ({
                      ...current,
                      gradientDirection: Number(value || 0),
                    }));
                  }}
                />
                <input
                  aria-label="Gradient direction slider"
                  type="range"
                  min={0}
                  max={359}
                  value={theme.gradientDirection}
                  className="w-full accent-[color:var(--theme-accent)]"
                  onChange={(event) => {
                    setTheme((current) => ({
                      ...current,
                      gradientDirection: Number(event.target.value),
                    }));
                  }}
                />
              </div>

              <div className="space-y-3">
                <Input
                  label="Intensity"
                  type="number"
                  min={0}
                  max={100}
                  description="0 is very subtle. 100 is strongest."
                  value={String(theme.gradientIntensity)}
                  classNames={numericFieldClassNames}
                  onValueChange={(value) => {
                    setTheme((current) => ({
                      ...current,
                      gradientIntensity: Number(value || 0),
                    }));
                  }}
                />
                <input
                  aria-label="Gradient intensity slider"
                  type="range"
                  min={0}
                  max={100}
                  value={theme.gradientIntensity}
                  className="w-full accent-[color:var(--theme-accent)]"
                  onChange={(event) => {
                    setTheme((current) => ({
                      ...current,
                      gradientIntensity: Number(event.target.value),
                    }));
                  }}
                />
              </div>
            </div>
          </div>

          <div className="theme-card rounded-[1.25rem] p-4 md:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
                Beta Features
              </p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                Turn experimental tooling on only when you want editors to access it.
              </p>
            </div>

            <div className="theme-subpanel rounded-[1.25rem] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-base font-semibold text-[color:var(--theme-text)]">Page Editing (Beta)</p>
                  <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">
                    Enables Edit Page links, the page studio route, and page-content APIs for users with the page-edit permission.
                  </p>
                </div>
                <Switch
                  isSelected={theme.pageEditorBetaEnabled}
                  color="primary"
                  onValueChange={(value) => {
                    setTheme((current) => ({ ...current, pageEditorBetaEnabled: value }));
                    setStatusMessage(value ? "Page editing beta enabled. Save to persist it." : "Page editing beta disabled. Save to persist it.");
                  }}
                >
                  {theme.pageEditorBetaEnabled ? "Enabled" : "Disabled"}
                </Switch>
              </div>
            </div>
          </div>

          <div className="theme-card rounded-[1.25rem] p-4 md:p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
                Announcement Banner
              </p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                Show a global banner above the header. It only appears on the site when enabled and the message has content.
              </p>
            </div>

            <div className="space-y-4">
              <div className="theme-subpanel rounded-[1.25rem] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-[color:var(--theme-text)]">Announcement Status</p>
                    <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">
                      Disable this to hide the banner everywhere without deleting the announcement text.
                    </p>
                  </div>
                  <Switch
                    isSelected={theme.announcementEnabled}
                    color="primary"
                    onValueChange={(value) => {
                      setTheme((current) => ({ ...current, announcementEnabled: value }));
                      setStatusMessage(value ? "Announcement enabled. Save to publish it." : "Announcement disabled. Save to hide it.");
                    }}
                  >
                    {theme.announcementEnabled ? "Enabled" : "Disabled"}
                  </Switch>
                </div>
              </div>

              <Textarea
                label="Announcement Text"
                minRows={3}
                description="Short site-wide message shown above the header."
                value={theme.announcementText}
                classNames={fieldClassNames}
                onValueChange={(value) => {
                  setTheme((current) => ({ ...current, announcementText: value }));
                }}
              />
            </div>
          </div>

          {colorThemeFields.map((field) => (
            <div key={field.key} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_4rem] md:items-end">
              <Input
                label={field.label}
                description={field.description}
                value={theme[field.key]}
                classNames={fieldClassNames}
                onValueChange={(value) => {
                  setTheme((current) => ({ ...current, [field.key]: value }));
                }}
              />
              <input
                aria-label={`${field.label} color picker`}
                type="color"
                value={theme[field.key]}
                className="theme-color-input"
                onChange={(event) => {
                  const value = event.target.value;
                  setTheme((current) => ({ ...current, [field.key]: value }));
                }}
              />
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" color="primary" isLoading={isSubmitting} className="px-6">
              Save Theme
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="theme-preview-card" style={previewVariables}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--theme-accent)]">
              Live Preview
            </p>
            <h4 className="text-3xl font-semibold tracking-tight text-[color:var(--theme-text)]">
              Shared Site Theme
            </h4>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--theme-text-muted)]">
              This preview uses the same CSS variables the layout applies to the website, so saved values will propagate to public pages and admin surfaces.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--theme-text-soft)]">
              <span className="theme-status-pill rounded-full px-3 py-1">
                {backgroundStyleOptions.find((option) => option.value === theme.backgroundStyle)?.label}
              </span>
              <span className="theme-status-pill rounded-full px-3 py-1">
                Direction {theme.gradientDirection}deg
              </span>
              <span className="theme-status-pill rounded-full px-3 py-1">
                Intensity {theme.gradientIntensity}
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="theme-preview-surface">
                <p className="text-sm font-semibold text-[color:var(--theme-text)]">Surface</p>
                <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                  Cards, panels, and overlays draw from this base.
                </p>
              </div>
              <div className="theme-preview-surface">
                <p className="text-sm font-semibold text-[color:var(--theme-text)]">Accent</p>
                <p className="mt-2 text-sm text-[color:var(--theme-accent)]">Interactive emphasis and highlights.</p>
              </div>
            </div>
          </div>

          <div className="theme-card rounded-[1.5rem] p-5">
            <div className="mb-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--theme-text-soft)]">
                Image Spotlights
              </p>
              <p className="mt-2 text-sm text-[color:var(--theme-text-muted)]">
                Toggle a spotlight effect for each tracked image. This uses the existing `data-track-image` ids as the image key.
              </p>
            </div>

            <div className="space-y-3">
              {imageSpotlights.map((spotlight) => {
                const isBusy = busyImageId === spotlight.imageId;

                return (
                  <div
                    key={spotlight.imageId}
                    className="theme-subpanel rounded-[1.25rem] p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-base font-semibold text-[color:var(--theme-text)]">{spotlight.label}</p>
                        <p className="mt-1 text-sm text-[color:var(--theme-text-muted)]">
                          {spotlight.description}
                        </p>
                        <p className="mt-2 text-xs font-mono text-[color:var(--theme-text-soft)]">
                          {spotlight.imageId}
                        </p>
                      </div>
                      <Switch
                        isSelected={spotlight.enabled}
                        isDisabled={isBusy}
                        color="primary"
                        onValueChange={(enabled) => {
                          void toggleImageSpotlight(spotlight.imageId, enabled);
                        }}
                      >
                        {spotlight.enabled ? "Spotlight on" : "Spotlight off"}
                      </Switch>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

