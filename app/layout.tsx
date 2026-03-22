import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import github from "@/app/github-142-svgrepo-com.svg";
import MobileNav from "@/app/components/mobile-nav";
import Providers from "@/app/providers";
import VisitorTracker from "@/app/components/visitor-tracker";
import ImageSpotlightManager from "@/app/components/image-spotlight-manager";
import CookieConsentBanner from "@/app/components/cookie-consent-banner";
import DeviceSessionGuard from "@/app/components/device-session-guard";
import { getEnabledImageSpotlightIds, getSiteTheme } from "@/lib/site-data";
import { DEFAULT_SITE_THEME, buildThemeCssVariables } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Matthaus Addy",
  description: "Studio website, selected works, and direct contact for Matthaus Addy.",
};

async function getLayoutThemeData() {
  try {
    const [siteTheme, enabledImageSpotlightIds] = await Promise.all([
      getSiteTheme(),
      getEnabledImageSpotlightIds(),
    ]);

    return {
      siteTheme,
      enabledImageSpotlightIds,
    };
  } catch {
    return {
      siteTheme: DEFAULT_SITE_THEME,
      enabledImageSpotlightIds: [] as string[],
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { siteTheme, enabledImageSpotlightIds } = await getLayoutThemeData();
  const themeVariables = buildThemeCssVariables(siteTheme) as CSSProperties;

  return (
    <html lang="en">
      <body className="antialiased" style={themeVariables}>
        <Providers>
          <DeviceSessionGuard />
          <VisitorTracker />
          <ImageSpotlightManager enabledImageIds={enabledImageSpotlightIds} />
          <header className="site-header">
            <h1 className="site-title">Matthaus Addy</h1>
            <MobileNav />
          </header>
          <main>{children}</main>
          <CookieConsentBanner />
          <div className="fixed bottom-4 right-4 flex items-center gap-2" id="footer">
            <span className="font-semibold">Site by wekul</span>
            <a href="https://github.com/wefird" target="_blank" rel="noopener noreferrer">
              <Image
                src={github}
                alt="GitHub"
                width={24}
                height={24}
                id="github-icon"
                data-track-image="footer-github-icon"
              />
            </a>
          </div>
        </Providers>
      </body>
    </html>
  );
}
