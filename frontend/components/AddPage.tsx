"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { format } from "date-fns";

const STATUSES = ["applied", "interview", "offer", "rejected", "unknown"] as const;

export default function AddPage() {
  const [form, setForm] = useState(() => ({
    company: "",
    role: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    status: "applied" as (typeof STATUSES)[number],
    source: "manual",
    notes: "",
    subject: "",
    sender: "",
  }));
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) { toast.error("Company is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("applications").insert([form]);
    setSaving(false);
    if (error) { toast.error("Failed to save: " + error.message); return; }
    toast.success("Application added!");
    setForm({
      company: "",
      role: "",
      date: format(new Date(), "yyyy-MM-dd"),
      time: "",
      status: "applied",
      source: "manual",
      notes: "",
      subject: "",
      sender: "",
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Add Application</h1>
        <p className="text-zinc-500 text-sm mt-1">Manually log a job application</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Company *</label>
            <Input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="e.g. Google, Stripe, SpaceX"
              className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-zinc-600 rounded-xl focus:border-indigo-500/50 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Role</label>
            <Input
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              placeholder="e.g. Software Engineer"
              className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-zinc-600 rounded-xl focus:border-indigo-500/50"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Date Applied</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className="bg-white/[0.04] border-white/[0.06] text-white rounded-xl"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => update("status", v ?? "applied")}>
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
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Job Posting URL <span className="text-zinc-600">(optional)</span></label>
            <Input
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              placeholder="https://..."
              className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-zinc-600 rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1.5 block font-medium">Notes</label>
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Recruiter name, interview date, salary info..."
              className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-zinc-600 rounded-xl"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-0 h-12 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/30 hover:scale-[1.01]"
            disabled={saving}
          >
            <PlusCircle size={18} className="mr-2" />
            {saving ? "Saving..." : "Add Application"}
          </Button>
        </form>
      </div>
    </div>
  );
}
