import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// This app is fully authenticated and all data is per-user — disable static
// pre-rendering. The super-admin is seeded by the backend (`npm run db:seed`).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Operations Command Center | GHL prime",
  description: "Real-time operations tracking and Kanban system for Octopi Digital's AI & Automation Team",
  icons: {
    icon: "https://assets.cdn.filesafe.space/j53xn6YJHwIdPImV00rn/media/69c3d85205117b94ac44014e.png",
    shortcut: "https://assets.cdn.filesafe.space/j53xn6YJHwIdPImV00rn/media/69c3d85205117b94ac44014e.png",
    apple: "https://assets.cdn.filesafe.space/j53xn6YJHwIdPImV00rn/media/69c3d85205117b94ac44014e.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();
          `
        }} />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
