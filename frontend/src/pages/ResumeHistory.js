import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Download, FileText, Sparkles } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ResumeHistory() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [r, a] = await Promise.all([
        api.get("/resume"),
        api.get("/analyses"),
      ]);
      setItems(r.data);
      setAnalyses(a.data);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    try {
      await api.delete(`/resume/${id}`);
      toast.success("Resume deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const download = (id, filename) => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/resume/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Download failed"));
  };

  return (
    <div className="space-y-8" data-testid="history-root">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">History</div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2">Your resumes</h1>
          <p className="text-gray-400 mt-2">All the resumes and analyses you've run.</p>
        </div>
        <Button onClick={() => nav("/app/upload")} className="bg-blue-600 hover:bg-blue-500 rounded-full px-5" data-testid="btn-goto-upload">
          <Sparkles className="w-4 h-4 mr-2" /> Upload new
        </Button>
      </div>

      <div className="panel overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] font-display font-bold text-lg">Resumes ({items.length})</div>
        {loading ? (
          <div className="px-6 py-10 text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-10 text-gray-500">No resumes yet. Upload one to get started.</div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {items.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors" data-testid={`resume-row-${r.id}`}>
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] grid place-items-center">
                  <FileText className="w-4 h-4 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.filename}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {(r.size_bytes / 1024).toFixed(0)} KB • {r.extracted?.skills?.length || 0} skills • {r.created_at.slice(0, 10)}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="secondary" size="sm"
                    className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10"
                    onClick={() => download(r.id, r.filename)}
                    data-testid={`btn-download-${r.id}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="bg-white/[0.05] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/40 text-rose-300" data-testid={`btn-delete-${r.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#11141d] border-white/10 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          This will also delete all analyses linked to this resume. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/[0.05] border-white/10 text-white hover:bg-white/[0.1]">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)} className="bg-rose-600 hover:bg-rose-500" data-testid={`btn-confirm-delete-${r.id}`}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] font-display font-bold text-lg">Recent analyses ({analyses.length})</div>
        {analyses.length === 0 ? (
          <div className="px-6 py-10 text-gray-500">No analyses yet.</div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {analyses.map((a) => (
              <button
                key={a.id}
                onClick={() => nav(`/app/analysis/${a.id}`)}
                className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/[0.03] text-left transition-colors"
                data-testid={`analysis-row-${a.id}`}
              >
                <div className="w-14 h-14 rounded-xl grid place-items-center bg-gradient-to-br from-blue-500/20 to-transparent border border-white/5">
                  <div className="font-display text-lg font-extrabold text-blue-300">{a.ats_score}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{a.jd_title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Match {a.skill_match_pct}% • Readiness {a.interview_readiness}% • {a.created_at.slice(0, 10)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
