import "./globals.css";
import PwaRegistration from "../components/PwaRegistration";
import { siteConfig } from "../lib/site";

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.shortName} - ${siteConfig.tagline.en}`,
    template: `%s - ${siteConfig.shortName}`,
  },
  description: siteConfig.tagline.en,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: ["/favicon.svg"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang={siteConfig.defaultLocale}>
      <body className="min-h-screen flex flex-col bg-white text-ink">
        {children}
        <PwaRegistration />
      </body>
    </html>
  );
}
