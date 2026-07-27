import "./globals.css";
import React from "react";

export const metadata = {
  title: "Duolingo Clone - Learn Spanish",
  description: "A gamified Duolingo clone built with Next.js and FastAPI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}