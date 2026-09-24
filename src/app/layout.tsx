import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Miniature Life Story Studio",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111111" />
      </head>
      <body className="bg-ink font-sans text-slate-100 antialiased">
        <Sidebar />
        <div className="min-h-screen md:pl-60">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
