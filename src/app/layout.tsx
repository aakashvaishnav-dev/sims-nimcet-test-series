import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "SIMS Raipur | NIMCET Test Series",
    template: "%s | SIMS Raipur"
  },
  description: "SIMS Raipur NIMCET online test series with timed tests, auto-submit, instant results and performance analysis.",
  applicationName: "SIMS NIMCET Test Series",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-512.png", apple: "/icon-512.png" },
  openGraph: {
    title: "SIMS Raipur | NIMCET Test Series",
    description: "Timed NIMCET mock tests with auto-submit and instant results.",
    images: ["/sims-raipur-logo.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
