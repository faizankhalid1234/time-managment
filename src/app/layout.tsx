import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Time Management",
    template: "%s | Time Management",
  },
  description:
    "Time Management — private project timers, live countdown, session history, and weekly graphs.",
  applicationName: "Time Management",
  keywords: [
    "project time tracker",
    "time tracking app",
    "Pakistan timezone",
    "countdown timer",
    "weekly project graph",
    "Time Management",
    "work hours tracker",
  ],
  authors: [{ name: "Time Management" }],
  creator: "Time Management",
  publisher: "Time Management",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteUrl,
    siteName: "Time Management",
    title: "Time Management",
    description:
      "Private project timers with live countdown, history, and weekly insights. Built for Pakistan time.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Time Management",
    description:
      "Create projects, start/end timers, and see where your hours go — Pakistan timezone.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Time Management",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Private project time tracker with countdown timers, session history, and weekly graphs in Pakistan timezone.",
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PKR",
    },
  };

  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('luma_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);r.style.colorScheme=t}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${outfit.variable} ${syne.variable} antialiased text-main`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
