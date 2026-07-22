import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { UploadCloud, File as FileIcon, Sparkles, X, CheckCircle2 } from "lucide-react";

export default function UploadResume() {
  const nav = useNavigate();
  const [resume, setResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [existing, setExisting] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [jdText, setJdText] = useState("");
  const [jdTitle, setJdTitle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    api.get("/resume").then((r) => setExisting(r.data)).catch(() => {});
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File must be < 5MB");
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) return toast.error("Only .pdf or .docx allowed");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/resume/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResume(data);
      setSelectedResumeId(data.id);
      setExisting((prev) => [data, ...prev]);
      toast.success("Resume uploaded & parsed");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  const analyze = async () => {
    if (!selectedResumeId) return toast.error("Upload or pick a resume first");
    if (jdText.trim().length < 20) return toast.error("Paste a job description (20+ chars)");
    setAnalyzing(true);
    try {
      const { data } = await api.post("/analyze", {
        resume_id: selectedResumeId,
        jd_text: jdText,
        jd_title: jdTitle || "Untitled Role",
      });
      toast.success("Analysis complete!");
      nav(`/app/analysis/${data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8" data-testid="upload-root">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Step 1 of 2</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2">Upload your resume</h1>
        <p className="text-gray-400 mt-2">PDF or DOCX, up to 5MB. We'll parse it in seconds.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`panel p-6`}
        >
          <div
            className={`dropzone ${drag ? "active" : ""} rounded-2xl p-10 text-center cursor-pointer`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById("file-input").click()}
            data-testid="dropzone"
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="hidden"
              data-testid="input-resume-file"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 grid place-items-center mx-auto">
              <UploadCloud className="w-7 h-7 text-blue-400" />
            </div>
            <div className="font-display font-bold text-xl mt-4">Drop your resume here</div>
            <div className="text-sm text-gray-500 mt-1">or click to browse — PDF, DOCX</div>
            <div className="text-xs text-gray-600 mt-3">Max 5MB</div>
          </div>

          {uploading && <div className="mt-4 text-sm text-blue-400 animate-pulse">Uploading & parsing…</div>}

          {resume && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 rounded-xl bg-white/[0.03] border border-emerald-500/20 p-4 flex items-center gap-3" data-testid="uploaded-preview">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{resume.filename}</div>
                <div className="text-xs text-gray-500">Extracted {resume.extracted?.skills?.length || 0} skills • {(resume.size_bytes / 1024).toFixed(0)} KB</div>
              </div>
            </motion.div>
          )}

          {existing.length > 0 && (
            <div className="mt-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">Or pick an existing resume</div>
              <div className="space-y-2 max-h-56 overflow-auto pr-2">
                {existing.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedResumeId(r.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      selectedResumeId === r.id
                        ? "border-blue-500/40 bg-blue-500/10"
                        : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                    data-testid={`btn-pick-resume-${r.id}`}
                  >
                    <FileIcon className="w-4 h-4 text-gray-400" />
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{r.filename}</div>
                      <div className="text-xs text-gray-500">
                        {(r.size_bytes / 1024).toFixed(0)} KB • {r.extracted?.skills?.length || 0} skills
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="panel p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Step 2</div>
          <div className="font-display font-bold text-2xl mt-1">Paste job description</div>
          <p className="text-sm text-gray-500 mt-1">The clearer the JD, the sharper the analysis.</p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="jdtitle" className="text-xs uppercase tracking-[0.15em] text-gray-400">Role title (optional)</Label>
              <Input
                id="jdtitle"
                data-testid="input-jd-title"
                value={jdTitle}
                onChange={(e) => setJdTitle(e.target.value)}
                placeholder="Senior Frontend Engineer"
                className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="jd" className="text-xs uppercase tracking-[0.15em] text-gray-400">Job description text</Label>
              <Textarea
                id="jd"
                data-testid="input-jd-text"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={12}
                placeholder="Paste the job description here..."
                className="mt-2 bg-black/20 border-white/10 rounded-xl focus:border-blue-500 resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">{jdText.length} chars</div>
            </div>
            <Button
              onClick={analyze}
              disabled={analyzing || !selectedResumeId || jdText.trim().length < 20}
              data-testid="btn-analyze"
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500"
            >
              {analyzing ? "Analyzing…" : (<><Sparkles className="w-4 h-4 mr-2" /> Run analysis</>)}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
