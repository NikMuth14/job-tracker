"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      const res = await fetch("/api/scan", {
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
    <div className="space-y-6 pb-24 md:pb-6 max-w-lg">
      <h1 className="text-2xl font-bold text-white">Scan Gmail</h1>

      {/* Mode selector */}
      <div className="flex gap-2">
        {(["today", "date", "range"] as const).map((m) => (
          <Button
            key={m}
            variant={mode === m ? "default" : "outline"}
            size="sm"
            className={
              mode === m
                ? "bg-indigo-600 hover:bg-indigo-700 border-0"
                : "border-gray-700 text-gray-300 hover:text-white"
            }
            onClick={() => setMode(m)}
          >
            {m === "today" && <ScanLine size={14} className="mr-1" />}
            {m === "date" && <Calendar size={14} className="mr-1" />}
            {m === "range" && <CalendarRange size={14} className="mr-1" />}
            {m === "today" ? "Today" : m === "date" ? "Specific Date" : "Date Range"}
          </Button>
        ))}
      </div>

      {/* Inputs */}
      {mode === "date" && (
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Select Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>
      )}

      {mode === "range" && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-gray-400 mb-1 block">From</label>
            <Input
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-gray-400 mb-1 block">To</label>
            <Input
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>
      )}

      {/* Scan button */}
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base"
        onClick={handleScan}
        disabled={scanning || !canScan}
      >
        {scanning ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⟳</span> Scanning Gmail...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ScanLine size={18} /> Start Scan
          </span>
        )}
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((r) => (
              <div
                key={r.date}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  {r.error ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : (
                    <CheckCircle size={16} className="text-green-400" />
                  )}
                  <span className="text-white text-sm">{r.date}</span>
                </div>
                {r.error ? (
                  <span className="text-red-400 text-xs">{r.error}</span>
                ) : (
                  <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    {r.count} app{r.count !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            ))}
            <p className="text-gray-500 text-xs pt-2">
              All results have been saved to your database and Google Sheet.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          <p className="text-gray-400 text-sm">
            <strong className="text-white">How it works:</strong> The scan reads your Gmail for job application
            confirmation emails using keywords, extracts company and role info, saves everything to
            the database, and updates your Google Sheet.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
