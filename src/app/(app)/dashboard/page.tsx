import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import RankingTable from "@/components/dashboard/RankingTable";
import type { RankingEntry, DbEvent } from "@/types/database";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; ano?: string }>;
}) {
  const { mes, ano } = await searchParams;
  const supabase = await getSupabaseServerClient();

  const now = new Date();
  const month = mes ? parseInt(mes) : now.getMonth() + 1;
  const year = ano ? parseInt(ano) : now.getFullYear();

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  // Aggregate game_results by user for the month
  const { data: resultsRaw } = await supabase
    .from("game_results")
    .select("user_id, points, position, users(name)")
    .gte("achieved_at", monthStart)
    .lt("achieved_at", monthEnd);

  const results = resultsRaw as Array<{ user_id: string; points: number; position: number; users: { name: string } | null }> | null;

  // Build ranking
  const userMap = new Map<string, RankingEntry>();
  for (const r of results ?? []) {
    const entry = userMap.get(r.user_id) ?? {
      user_id: r.user_id,
      name: (r as any).users?.name ?? "—",
      total_points: 0,
      wins: 0,
    };
    entry.total_points += r.points;
    if (r.position === 1) entry.wins += 1;
    userMap.set(r.user_id, entry);
  }

  const ranking: RankingEntry[] = Array.from(userMap.values()).sort(
    (a, b) => b.total_points - a.total_points
  );

  // Finished events
  const { data: finishedEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "finished")
    .order("date", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Ranking mensal e histórico de eventos</p>
      </div>

      {/* Ranking */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            Ranking — {String(month).padStart(2, "0")}/{year}
          </h2>
          <MonthNav month={month} year={year} />
        </div>
        <RankingTable ranking={ranking} />
      </div>

      {/* Event history */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Histórico de Eventos</h2>
        {!finishedEvents?.length ? (
          <p className="text-gray-400 text-sm">Nenhum evento finalizado ainda.</p>
        ) : (
          <div className="space-y-2">
            {finishedEvents.map((e: DbEvent) => (
              <a
                key={e.id}
                href={`/eventos/${e.id}`}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:text-blue-600 transition-colors"
              >
                <span className="font-medium text-gray-800">{e.name}</span>
                <span className="text-sm text-gray-400">{formatDate(e.date)}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MonthNav({ month, year }: { month: number; year: number }) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return (
    <div className="flex items-center gap-2 text-sm">
      <a
        href={`/dashboard?mes=${prevMonth}&ano=${prevYear}`}
        className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
      >
        ←
      </a>
      <a
        href={`/dashboard?mes=${nextMonth}&ano=${nextYear}`}
        className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
      >
        →
      </a>
    </div>
  );
}
