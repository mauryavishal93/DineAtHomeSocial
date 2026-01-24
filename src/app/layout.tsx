import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { fontDisplay, fontSans } from "@/app/fonts";

export const metadata: Metadata = {
  title: "DineAtHome Social",
  description: "Home-hosted dining, made social."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

