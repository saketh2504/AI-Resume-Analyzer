import React, { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Settings() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);

  const change = async (e) => {
    e.preventDefault();
    if (next.length < 6) return toast.error("Password must be 6+ chars");
    setLoading(true);
    try {
      await api.put("/auth/profile", { current_password: current, new_password: next });
      toast.success("Password updated");
      setCurrent("");
      setNext("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl" data-testid="settings-root">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Account</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2">Settings</h1>
      </div>

      <div className="panel p-6">
        <div className="font-display font-bold text-xl mb-4">Change password</div>
        <form onSubmit={change} className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-[0.15em] text-gray-400">Current password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500" data-testid="input-current-password" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.15em] text-gray-400">New password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500" data-testid="input-new-password-settings" />
          </div>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 rounded-full h-11 px-6" data-testid="btn-change-password">
            {loading ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>

      <div className="panel p-6">
        <div className="font-display font-bold text-xl mb-2">Preferences</div>
        <div className="text-sm text-gray-500">Dark mode is enforced. Additional preferences coming soon.</div>
      </div>
    </div>
  );
}
