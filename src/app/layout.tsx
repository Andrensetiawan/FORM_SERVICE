import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Form Service",
  description: "Form Service Customer Input",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex items-center justify-center p-6">
        {children}
      </body>
    </html>
  );
}
