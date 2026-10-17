"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase, type Application } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const statusColors: Record<string, string> = {
  applied: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  interview: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  offer: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  unknown: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

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

  return (
    <div className="space-y-4 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Applications</h1>
        <span className="text-gray-400 text-sm">{filtered.length} results</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search company, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40 bg-gray-900 border-gray-700 text-white">
            <Filter size={14} className="mr-2 text-gray-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full sm:w-44 bg-gray-900 border-gray-700 text-white"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-gray-400 text-center py-16">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500 text-center py-16">No applications found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => (
            <Card key={app.id} className="bg-gray-900 border-gray-800">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold truncate">{app.company}</span>
                      <Badge className={`${statusColors[app.status]} text-xs shrink-0`}>
                        {app.status}
                      </Badge>
                    </div>
                    {app.role && (
                      <p className="text-indigo-300 text-sm truncate">{app.role}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {app.date} · {app.time}
                      {app.notes && <span className="ml-2 text-yellow-500">📝</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => setEditing(app)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-red-400"
                      onClick={() => handleDelete(app.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Company</label>
                <Input
                  value={editing.company}
                  onChange={(e) => setEditing({ ...editing, company: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Role</label>
                <Input
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Date</label>
                <Input
                  type="date"
                  value={editing.date}
                  onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Status</label>
                <Select
                  value={editing.status}
                  onValueChange={(v) => setEditing({ ...editing, status: v as Application["status"] })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Notes</label>
                <Textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                  placeholder="Interview notes, contacts, etc."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" className="flex-1 border-gray-700" onClick={() => setEditing(null)}>
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
