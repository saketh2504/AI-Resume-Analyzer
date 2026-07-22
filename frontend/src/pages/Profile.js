import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put("/auth/profile", { name, email });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl" data-testid="profile-root">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Account</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2">Profile</h1>
      </div>

      <div className="panel p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center text-2xl font-display font-bold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="font-display font-bold text-2xl">{user?.name}</div>
            <div className="text-sm text-gray-500">Role: <span className="capitalize text-gray-300">{user?.role}</span></div>
          </div>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-[0.15em] text-gray-400">Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500" data-testid="input-profile-name" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.15em] text-gray-400">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500" data-testid="input-profile-email" />
          </div>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 rounded-full h-11 px-6" data-testid="btn-save-profile">
            {loading ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </div>
  );
}
