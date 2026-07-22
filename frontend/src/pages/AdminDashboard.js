import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import { Trash2, Users, FileText, TrendingUp, Gauge } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const [tab, setTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [a, u, r] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/users"),
        api.get("/admin/resumes"),
      ]);
      setAnalytics(a.data);
      setUsers(u.data);
      setResumes(r.data);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User deleted");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="space-y-8" data-testid="admin-root">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-violet-300 font-bold">Admin</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2">Control panel</h1>
        <p className="text-gray-400 mt-2">Users, resumes and platform-wide analytics.</p>
      </div>

      <div className="flex gap-2 border-b border-white/[0.06]">
        {["overview", "users", "resumes"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-testid={`tab-${t}`}
            className={`px-4 py-2 text-sm capitalize border-b-2 transition-colors ${
              tab === t ? "border-violet-400 text-white" : "border-transparent text-gray-500 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}

      {!loading && tab === "overview" && analytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard testid="admin-users" icon={Users} label="Users" value={analytics.total_users} accent="blue" />
            <StatCard testid="admin-resumes" icon={FileText} label="Resumes" value={analytics.total_resumes} accent="cyan" />
            <StatCard testid="admin-analyses" icon={TrendingUp} label="Analyses" value={analytics.total_analyses} accent="violet" />
            <StatCard testid="admin-avg-ats" icon={Gauge} label="Avg ATS" value={analytics.average_ats_score} accent="green" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="panel p-6">
              <div className="font-display font-bold text-xl">Top matched skills</div>
              <div className="mt-4 space-y-2">
                {analytics.top_matched_skills.length === 0 && <div className="text-gray-500 text-sm">No data yet</div>}
                {analytics.top_matched_skills.map((s) => (
                  <div key={s.skill} className="flex items-center gap-3">
                    <div className="flex-1 text-sm text-gray-300 capitalize">{s.skill}</div>
                    <div className="chip chip-match">{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel p-6">
              <div className="font-display font-bold text-xl">Top missing skills</div>
              <div className="mt-4 space-y-2">
                {analytics.top_missing_skills.length === 0 && <div className="text-gray-500 text-sm">No data yet</div>}
                {analytics.top_missing_skills.map((s) => (
                  <div key={s.skill} className="flex items-center gap-3">
                    <div className="flex-1 text-sm text-gray-300 capitalize">{s.skill}</div>
                    <div className="chip chip-miss">{s.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && tab === "users" && (
        <div className="panel overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] font-display font-bold text-lg">Users ({users.length})</div>
          <div className="divide-y divide-white/[0.05]">
            {users.map((u) => (
              <div key={u.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02]" data-testid={`user-row-${u.id}`}>
                <div className="w-10 h-10 rounded-full bg-white/[0.05] grid place-items-center font-semibold">{u.name?.[0]?.toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.name} <span className="chip ml-2 capitalize">{u.role}</span></div>
                  <div className="text-xs text-gray-500 mt-0.5">{u.email} • Joined {u.created_at?.slice(0, 10)}</div>
                </div>
                {u.role !== "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="secondary" className="bg-white/[0.05] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/40 text-rose-300" data-testid={`btn-delete-user-${u.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#11141d] border-white/10 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete user {u.name}?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          All their resumes and analyses will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.1]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-rose-600 hover:bg-rose-500" data-testid={`btn-confirm-delete-user-${u.id}`}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && tab === "resumes" && (
        <div className="panel overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] font-display font-bold text-lg">Resumes ({resumes.length})</div>
          <div className="divide-y divide-white/[0.05]">
            {resumes.length === 0 && <div className="px-6 py-10 text-gray-500">No resumes yet.</div>}
            {resumes.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center gap-4" data-testid={`admin-resume-row-${r.id}`}>
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] grid place-items-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.filename}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    User: {r.user_id.slice(0, 8)}… • {(r.size_bytes / 1024).toFixed(0)} KB • {r.created_at?.slice(0, 10)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
