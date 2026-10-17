"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Application } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pencil, Trash2, Search, Filter } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["applied", "interview", "offer", "rejected", "unknown"] as const;

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filtered, setFiltered] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("date", { ascending: false })
      .order("time", { ascending: false });
    setApps((data as Application[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = apps;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.company.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (dateFilter) {
      result = result.filter((a) => a.date === dateFilter);
    }
    setFiltered(result);
  }, [apps, search, statusFilter, dateFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this application?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Application deleted");
    load();
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("applications")
      .update({
        company: editing.company,
        role: editing.role,
        status: editing.status,
        notes: editing.notes,
        date: editing.date,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error("Save failed"); return; }
    toast.success("Saved!");
    setEditing(null);
    load();
  }

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    applied:   { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
    interview: { bg: "bg-teal-500/10",   text: "text-teal-400",   dot: "bg-teal-400" },
    offer:     { bg: "bg-green-500/10",  text: "text-green-400",  dot: "bg-green-400" },
    rejected:  { bg: "bg-red-500/10",    text: "text-red-400",    dot: "bg-red-400" },
    unknown:   { bg: "bg-zinc-500/10",   text: "text-zinc-400",   dot: "bg-zinc-400" },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-zinc-500 text-sm mt-1">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search company, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/[0.04] border-white/[0.06] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 focus:ring-emerald-500/20 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-40 bg-white/[0.04] border-white/[0.06] text-white rounded-xl">
              <Filter size={14} className="mr-2 text-zinc-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/[0.08] rounded-xl">
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-44 bg-white/[0.04] border-white/[0.06] text-white rounded-xl"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-20 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center">
          <p className="text-zinc-500">No applications found.</p>
          <p className="text-zinc-600 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => {
            const cfg = statusConfig[app.status] ?? statusConfig.unknown;
            return (
              <div key={app.id} className="glass-card rounded-2xl p-4 hover:bg-white/[0.04] transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm font-bold ${cfg.text}`}>
                      {app.company.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm truncate">{app.company}</span>
                      <Badge className={`${cfg.bg} ${cfg.text} border-0 text-[10px] px-2 py-0.5`}>
                        {app.status}
                      </Badge>
                    </div>
                    {app.role && (
                      <p className="text-emerald-300/70 text-xs truncate mt-0.5">{app.role}</p>
                    )}
                    <p className="text-zinc-600 text-xs mt-0.5">
                      {app.date} {app.time && `· ${app.time}`}
                      {app.notes && <span className="ml-1.5 text-amber-500/60">has notes</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded-lg"
                      onClick={() => setEditing(app)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      onClick={() => handleDelete(app.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-zinc-900/95 border-white/[0.08] text-white backdrop-blur-xl rounded-2xl"
          style={{ backdropFilter: "blur(20px)" }}>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Application</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Company</label>
                <Input
                  value={editing.company}
                  onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Role</label>
                <Input
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Date</label>
                <Input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Status</label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as Application["status"] })}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/[0.08] rounded-xl">
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Notes</label>
                <Textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl"
                  rows={3}
                  placeholder="Interview notes, contacts, etc."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 rounded-xl h-11 font-semibold shadow-lg shadow-emerald-500/20"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" className="flex-1 border-white/[0.08] text-zinc-300 hover:bg-white/[0.04] rounded-xl h-11" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
