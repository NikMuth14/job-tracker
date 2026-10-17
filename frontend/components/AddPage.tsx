"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="max-w-lg space-y-6 pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-white">Add Application</h1>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Manual Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Company *</label>
              <Input
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="e.g. Google, Stripe, SpaceX"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Role</label>
              <Input
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                placeholder="e.g. Software Engineer"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Date Applied</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-1 block">Status</label>
                <Select value={form.status} onValueChange={(v) => update("status", v ?? "applied")}>
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
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Job Posting URL (optional)</label>
              <Input
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="https://..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Notes</label>
              <Textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Recruiter name, interview date, salary info..."
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                rows={3}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
              disabled={saving}
            >
              <PlusCircle size={18} className="mr-2" />
              {saving ? "Saving..." : "Add Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
