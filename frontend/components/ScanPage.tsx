"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ScanLine, Calendar, CalendarRange, CheckCircle, XCircle } from "lucide-react";

type ScanResult = {
  date: string;
  count: number;
  error?: string;
};

export default function ScanPage() {
  const [mode, setMode] = useState<"today" | "date" | "range">("today");
  const [date, setDate] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);

  async function handleScan() {
    setScanning(true);
    setResults([]);

    try {
      const body: Record<string, string> = { mode };
      if (mode === "date") body.date = date;
      if (mode === "range") { body.from = rangeFrom; body.to = rangeTo; }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
      const res = await fetch(`${backendUrl}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Scan failed");
        return;
      }

      setResults(data.results ?? []);
      const total = (data.results as ScanResult[]).reduce((sum, r) => sum + (r.count ?? 0), 0);
      toast.success(`Scan complete! Found ${total} application(s).`);
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setScanning(false);
    }
  }

  const canScan =
    mode === "today" ||
    (mode === "date" && date) ||
    (mode === "range" && rangeFrom && rangeTo);

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white">Scan Gmail</h1>
        <p className="text-zinc-500 text-sm mt-1">Import applications from your inbox</p>
      </div>

      {/* Mode selector */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex gap-2">
          {(["today", "date", "range"] as const).map((m) => (
            <button
              key={m}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
              }`}
              onClick={() => setMode(m)}
            >
              {m === "today" && <ScanLine size={14} />}
              {m === "date" && <Calendar size={14} />}
              {m === "range" && <CalendarRange size={14} />}
              {m === "today" ? "Today" : m === "date" ? "Date" : "Range"}
            </button>
          ))}
        </div>

        {/* Inputs */}
        {mode === "date" && (
          <div className="mt-4">
            <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Select Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl"
            />
          </div>
        )}

        {mode === "range" && (
          <div className="flex gap-3 mt-4">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1.5 block font-medium">From</label>
              <Input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1.5 block font-medium">To</label>
              <Input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl"
              />
            </div>
          </div>
        )}
      </div>

      {/* Scan button */}
      <Button
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 h-12 text-base rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/30 hover:scale-[1.01]"
        onClick={handleScan}
        disabled={scanning || !canScan}
      >
        {scanning ? (
          <span className="flex items-center gap-2">
            <ScanLine size={18} className="animate-spin" /> Scanning Gmail...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ScanLine size={18} /> Start Scan
          </span>
        )}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="glass-card rounded-2xl p-5 glow-green">
          <h2 className="text-sm font-semibold text-white mb-3">Results</h2>
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.date}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-3">
                  {r.error ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : (
                    <CheckCircle size={16} className="text-emerald-400" />
                  )}
                  <span className="text-white text-sm font-medium">{r.date}</span>
                </div>
                {r.error ? (
                  <span className="text-red-400 text-xs">{r.error}</span>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-0 text-xs">
                    {r.count} app{r.count !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            ))}
            <p className="text-zinc-600 text-xs pt-2">
              Saved to database and Google Sheet.
            </p>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5">
        <p className="text-zinc-400 text-sm leading-relaxed">
          <strong className="text-zinc-200">How it works:</strong> The scan reads your Gmail for job application
          confirmation emails, extracts company and role info, saves everything to
          the database, and updates your Google Sheet.
        </p>
      </div>
    </div>
  );
}
