import type { Metadata } from "next";
import "./globals.css";
import AppProvider from "@/components/AppProvider";

export const metadata: Metadata = {
  title: "PT.Alif Cyyber Solution",
  description: "Form Service Customer Input",
  icons: {
    icon: "/logo-ico.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
