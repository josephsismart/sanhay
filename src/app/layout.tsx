import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const BASE_URL = "https://sanhay.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Sanhay | Agusan National High School Information System",
    template: "%s | Sanhay ANHS",
  },
  description:
    "Sanhay - Official School Information System of Agusan National High School, Butuan City, Agusan del Norte. Manage learners, personnel, grades, sections, and school operations.",
  keywords: [
    "Agusan National High School",
    "ANHS",
    "Butuan City",
    "School Information System",
    "Sanhay",
    "DepEd",
    "Region XIII",
  ],
  authors: [{ name: "Joseph O. Sismar", url: "mailto:josephsismart@gmail.com" }],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: BASE_URL,
    siteName: "Sanhay | ANHS",
    title: "Sanhay | Agusan National High School Information System",
    description:
      "Official School Information System of Agusan National High School, Butuan City. Manage learners, personnel, grades, and school operations.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Sanhay - Agusan National High School Information System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanhay | Agusan National High School",
    description:
      "Official School Information System of Agusan National High School, Butuan City.",
    images: [`${BASE_URL}/og-image.png`],
  },
  icons: {
    icon: [{ url: "/anhs-logo.png", type: "image/png" }],
    apple: [{ url: "/anhs-logo.png", type: "image/png" }],
    shortcut: "/anhs-logo.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Fonts for ID card legacy compatibility */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=League+Gothic&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
