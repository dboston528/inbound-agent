import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Strategy Assistant",
  description: "Inbound sales agent for automation strategy qualification",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
