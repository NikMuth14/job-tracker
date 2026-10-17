"use client";

import { useEffect, useState } from "react";
import { supabase, type Application } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Briefcase, TrendingUp, Flame, Calendar } from "lucide-react";

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

      // Total
      setTotalCount(all.length);

      // Today
      setTodayCount(all.filter((a) => a.date === today).length);

      // Month
      setMonthCount(
        all.filter((a) => a.date >= monthStart && a.date <= monthEnd).length
      );

      // Recent apps
      setRecentApps((recent as Application[]) ?? []);

      // Status breakdown
      const breakdown: Record<string, number> = {};
      all.forEach((a) => {
        breakdown[a.status] = (breakdown[a.status] ?? 0) + 1;
      });
      setStatusBreakdown(breakdown);

      // Last 30 days chart
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

      // Streak — consecutive days with at least 1 app ending today
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

  const statusColors: Record<string, string> = {
    applied: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    interview: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    offer: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    unknown: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Briefcase size={20} />} label="Today" value={todayCount} color="indigo" />
        <StatCard icon={<Calendar size={20} />} label="This Month" value={monthCount} color="purple" />
        <StatCard icon={<TrendingUp size={20} />} label="Total" value={totalCount} color="blue" />
        <StatCard icon={<Flame size={20} />} label="Day Streak" value={streak} color="orange" />
      </div>

      {/* Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Applications — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={last30} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                tickLine={false}
                interval={4}
              />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#e5e7eb" }}
                itemStyle={{ color: "#a5b4fc" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {last30.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.date === format(new Date(), "yyyy-MM-dd") ? "#818cf8" : "#4f46e5"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status breakdown */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(statusBreakdown).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <Badge className={statusColors[status] ?? statusColors.unknown}>
                {status}
              </Badge>
              <span className="text-white font-semibold">{count}</span>
            </div>
          ))}
          {Object.keys(statusBreakdown).length === 0 && (
            <span className="text-gray-500 text-sm">No data yet</span>
          )}
        </CardContent>
      </Card>

      {/* Recent applications */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Recent Applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentApps.length === 0 && (
            <p className="text-gray-500 text-sm">No applications yet. Run a Gmail scan!</p>
          )}
          {recentApps.map((app) => (
            <div
              key={app.id}
              className="flex items-start justify-between p-3 rounded-lg bg-gray-800 gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{app.company}</p>
                <p className="text-gray-400 text-sm truncate">{app.role || app.subject}</p>
                <p className="text-gray-600 text-xs mt-1">{app.date} · {app.time}</p>
              </div>
              <Badge className={`${statusColors[app.status]} shrink-0`}>
                {app.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    blue: "text-blue-400",
    orange: "text-orange-400",
  };
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="pt-4">
        <div className={`${colors[color]} mb-2`}>{icon}</div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-gray-400 text-sm mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
