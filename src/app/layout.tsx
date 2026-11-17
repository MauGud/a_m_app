import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SyncProvider } from "@/components/sync-provider";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A & M",
  description: "Tu espacio privado para compartir momentos en pareja",
  manifest: "/manifest.json",
  applicationName: "A & M",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "A & M",
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFB5C5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SyncProvider>
          <PwaRegister />
          {children}
        </SyncProvider>
      </body>
    </html>
  );
}
