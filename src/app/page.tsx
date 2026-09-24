import Link from "next/link";
import { Card, PageHeader, Button } from "@/components/ui";

const CARDS = [
  { href: "/studio", title: "Story Studio", desc: "Polish rough ideas with your selected model and save them as stories.", cta: "Open Studio" },
  { href: "/stories", title: "Stories", desc: "Browse saved stories and open them in the pro-script pipeline.", cta: "View Stories" },
  { href: "/characters", title: "Characters", desc: "Manage your miniature cast, bible details, and reference images.", cta: "View Characters" },
  { href: "/models", title: "Models", desc: "Bring your own keys, pick providers, and choose the default model.", cta: "Manage Models" },
];

export default function Home() {
  return (
    <main>
      <PageHeader
        title={
          <>
            Miniature <span className="text-gradient">Life</span> Story Studio
          </>
        }
        sub="A vibrant creator studio for tiny characters and big stories. Pick a starting point below."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Card key={c.href} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white">{c.title}</h2>
            <p className="flex-1 text-sm text-slate-400">{c.desc}</p>
            <Link href={c.href}>
              <Button variant="primary">{c.cta}</Button>
            </Link>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/import" className="text-cyan hover:underline">
          Import old app
        </Link>
        <span className="text-slate-600">·</span>
        <Link href="/login" className="text-slate-400 hover:text-white">
          Login
        </Link>
      </div>
    </main>
  );
}
