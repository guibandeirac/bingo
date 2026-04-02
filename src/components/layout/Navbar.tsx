"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DbUser } from "@/types/database";

interface Props {
  profile: DbUser | null;
}

export default function Navbar({ profile }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const navLinks = [
    { href: "/dashboard", label: "Ranking" },
    { href: "/eventos", label: "Eventos" },
  ];

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg tracking-tight">
            🎮 BC Games
          </Link>
          <div className="flex gap-4 text-sm">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`hover:text-blue-200 transition-colors ${pathname.startsWith(l.href) ? "text-blue-200 font-semibold" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          {profile && (
            <span className="text-blue-200">
              {profile.name}
              {profile.role === "admin" && (
                <span className="ml-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  Admin
                </span>
              )}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="text-blue-200 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
