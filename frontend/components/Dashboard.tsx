"use client";

import { useEffect, useState } from "react";
import { supabase, type Application } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Briefcase, TrendingUp, Flame, Calendar, ArrowUpRight } from "lucide-react";

type DayCount = { date: string; count: number; label: string };

export default function Dashboard() {
  const [last30, setLast30] = useState<DayCount[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
      const thirtyDaysAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");

      const [{ data: all }, { data: recent }] = await Promise.all([
        supabase.from("applications").select("date, status"),
        supabase
          .from("applications")
          .select("*")
          .order("date", { ascending: false })
          .order("time", { ascending: false })
          .limit(10),
      ]);

      if (!all) return;

      setTotalCount(all.length);
      setTodayCount(all.filter((a) => a.date === today).length);
      setMonthCount(
        all.filter((a) => a.date >= monthStart && a.date <= monthEnd).length
      );
      setRecentApps((recent as Application[]) ?? []);

      const breakdown: Record<string, number> = {};
      all.forEach((a) => {
        breakdown[a.status] = (breakdown[a.status] ?? 0) + 1;
      });
      setStatusBreakdown(breakdown);

      const countByDate: Record<string, number> = {};
      all.forEach((a) => {
        if (a.date >= thirtyDaysAgo) {
          countByDate[a.date] = (countByDate[a.date] ?? 0) + 1;
        }
      });
      const days: DayCount[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        days.push({
          date: d,
          count: countByDate[d] ?? 0,
          label: format(subDays(new Date(), i), "MMM d"),
        });
      }
      setLast30(days);

      let s = 0;
      for (let i = 0; i < 365; i++) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        if ((countByDate[d] ?? 0) > 0 || (all.filter((a) => a.date === d).length > 0)) {
          s++;
        } else {
          break;
        }
      }
      setStreak(s);

      setLoading(false);
    }
    load();
  }, []);

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    applied:   { bg: "bg-blue-500/10",   text: "text-blue-400",   dot: "bg-blue-400" },
    interview: { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400" },
    offer:     { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    rejected:  { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400" },
    unknown:   { bg: "bg-zinc-500/10",   text: "text-zinc-400",   dot: "bg-zinc-400" },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-28 shimmer" />
          ))}
        </div>
        <div className="glass-card rounded-2xl h-56 shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Your application overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Briefcase size={18} />} label="Today" value={todayCount} gradient="from-indigo-500/20 to-indigo-600/5" glow="glow-indigo" iconColor="text-indigo-400" />
        <StatCard icon={<Calendar size={18} />} label="This Month" value={monthCount} gradient="from-purple-500/20 to-purple-600/5" glow="glow-purple" iconColor="text-purple-400" />
        <StatCard icon={<TrendingUp size={18} />} label="Total" value={totalCount} gradient="from-blue-500/20 to-blue-600/5" glow="glow-blue" iconColor="text-blue-400" />
        <StatCard icon={<Flame size={18} />} label="Day Streak" value={streak} gradient="from-orange-500/20 to-orange-600/5" glow="glow-orange" iconColor="text-orange-400" />
      </div>

      {/* Chart */}
      <div className="glass-card rounded-2xl p-5 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Last 30 Days</h2>
          <span className="text-xs text-zinc-500">{last30.reduce((s, d) => s + d.count, 0)} total</span>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={last30} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="barGradToday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                <stop offset="100%" stopColor="#818cf8" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fill: "#52525b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis tick={{ fill: "#52525b", fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(24, 24, 27, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "#fafafa", fontWeight: 600, marginBottom: 2 }}
              itemStyle={{ color: "#a5b4fc" }}
              cursor={{ fill: "rgba(129, 140, 248, 0.06)" }}
            />
            <Bar dataKey="count" radius={[6, 6, 2, 2]}>
              {last30.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.date === format(new Date(), "yyyy-MM-dd") ? "url(#barGradToday)" : "url(#barGrad)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status breakdown + Recent in a grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="glass-card rounded-2xl p-5 transition-all duration-300">
          <h2 className="text-sm font-semibold text-white mb-4">Status Breakdown</h2>
          <div className="space-y-2.5">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const cfg = statusConfig[status] ?? statusConfig.unknown;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-zinc-300 text-sm capitalize flex-1">{status}</span>
                  <span className="text-zinc-500 text-xs">{pct}%</span>
                  <span className={`text-sm font-semibold ${cfg.text}`}>{count}</span>
                </div>
              );
            })}
            {Object.keys(statusBreakdown).length === 0 && (
              <span className="text-zinc-600 text-sm">No data yet</span>
            )}
          </div>
        </div>

        {/* Recent applications */}
        <div className="glass-card rounded-2xl p-5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
            <a href="/applications" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="space-y-2">
            {recentApps.length === 0 && (
              <p className="text-zinc-600 text-sm">No applications yet. Run a Gmail scan!</p>
            )}
            {recentApps.slice(0, 5).map((app) => {
              const cfg = statusConfig[app.status] ?? statusConfig.unknown;
              return (
                <div
                  key={app.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-xs font-bold ${cfg.text}`}>
                      {app.company.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{app.company}</p>
                    <p className="text-zinc-500 text-xs truncate">{app.role || app.subject}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge className={`${cfg.bg} ${cfg.text} border-0 text-[10px] px-2 py-0.5`}>
                      {app.status}
                    </Badge>
                    <p className="text-zinc-600 text-[10px] mt-1">{app.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  gradient,
  glow,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  gradient: string;
  glow: string;
  iconColor: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] ${glow}`}>
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} pointer-events-none`} />
      <div className="relative">
        <div className={`${iconColor} mb-3`}>{icon}</div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-zinc-500 text-xs mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}
