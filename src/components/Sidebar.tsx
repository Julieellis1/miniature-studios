"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/studio", label: "Story Studio" },
  { href: "/stories", label: "Stories" },
  { href: "/characters", label: "Characters" },
  { href: "/models", label: "Models" },
  { href: "/import", label: "Import" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [modelLabel, setModelLabel] = useState<string | null>(null);
  const [hasModel, setHasModel] = useState(false);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then((rows: any[]) => {
        if (!Array.isArray(rows) || rows.length === 0) {
          setHasModel(false);
          setModelLabel(null);
          return;
        }
        setHasModel(true);
        const sel = rows.find((m) => m.isSelected) ?? rows[0];
        setModelLabel(sel?.label ?? sel?.model ?? "Model");
      })
      .catch(() => {
        setHasModel(false);
        setModelLabel(null);
      });
  }, [pathname]);

  const linkCls = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href || pathname?.startsWith(href + "/")
        ? "bg-white/10 text-white"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <>
      {/* Desktop: fixed left sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-white/10 bg-panel/80 backdrop-blur md:flex">
        <div className="px-5 pb-4 pt-6">
          <Link href="/" className="text-lg font-extrabold tracking-wide text-white">
            MINIATURE <span className="text-gradient">LIFE</span>
          </Link>
          <p className="mt-1 text-xs text-slate-500">Story Studio</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={linkCls(n.href)}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-xs">
            <div className="text-slate-500">Selected model</div>
            <div className="truncate font-semibold text-slate-200">
              {hasModel && modelLabel ? modelLabel : "No model"}
            </div>
          </div>
          <Link href="/" className="block text-xs text-slate-400 hover:text-white">
            Home
          </Link>
        </div>
      </aside>

      {/* Mobile: top bar with horizontal nav */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-panel/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-base font-extrabold tracking-wide text-white">
            MINIATURE <span className="text-gradient">LIFE</span>
          </Link>
          <div className="rounded-full border border-white/10 bg-ink px-2.5 py-1 text-[11px] text-slate-300">
            {hasModel && modelLabel ? modelLabel : "No model"}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`${linkCls(n.href)} whitespace-nowrap`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
