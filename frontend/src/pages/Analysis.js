import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AtsGauge from "@/components/AtsGauge";
import { motion } from "framer-motion";
import { Sparkles, Download, MessageSquare, ChevronLeft, FileDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

export default function Analysis() {
  const { id } = useParams();
  const nav = useNavigate();
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/analyses/${id}`).then((r) => setA(r.data)).catch(() => {
      toast.error("Analysis not found");
      nav("/app/history");
    }).finally(() => setLoading(false));
  }, [id, nav]);

  if (loading) return <div className="text-gray-400">Loading analysis…</div>;
  if (!a) return null;

  const breakdown = Object.entries(a.ats_breakdown).map(([k, v]) => ({ name: k, score: v }));

  return (
    <div className="space-y-8" data-testid="analysis-root">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <button onClick={() => nav("/app/history")} className="text-xs text-gray-500 hover:text-white flex items-center gap-1 mb-2" data-testid="btn-back">
            <ChevronLeft className="w-3 h-3" /> Back to history
          </button>
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Analysis</div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2" data-testid="analysis-jd-title">{a.jd_title}</h1>
          <p className="text-gray-400 mt-2">Resume: <span className="text-gray-300">{a.resume_filename}</span> • {a.created_at?.slice(0, 10)}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => window.print()} variant="secondary" className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-full px-5" data-testid="btn-print">
            <FileDown className="w-4 h-4 mr-2" /> Export PDF
          </Button>
          <Button onClick={() => nav("/app/interview", { state: { analysis_id: a.id } })} className="bg-blue-600 hover:bg-blue-500 rounded-full px-5" data-testid="btn-generate-interview">
            <MessageSquare className="w-4 h-4 mr-2" /> Interview kit
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-8 flex flex-col items-center justify-center">
          <AtsGauge value={a.ats_score} testid="ats-gauge" />
          <div className="mt-4 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Verdict</div>
            <div className="font-display font-bold text-xl mt-1">
              {a.ats_score >= 75 ? "Excellent" : a.ats_score >= 50 ? "Good, needs work" : "Needs improvement"}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Breakdown</div>
              <div className="font-display font-bold text-xl">ATS parameters</div>
            </div>
          </div>
          <div className="h-64" data-testid="chart-ats-breakdown">
            <ResponsiveContainer>
              <BarChart data={breakdown} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#6b7280" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: "#11141d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={["#3b82f6", "#4ade80", "#facc15", "#a78bfa", "#22d3ee", "#f472b6", "#fb923c", "#34d399"][i % 8]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="panel p-6 lg:col-span-3 grid sm:grid-cols-3 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Skill match</div>
            <div className="font-display text-4xl font-extrabold mt-2" data-testid="stat-match-pct">{a.skill_match_pct}%</div>
            <div className="text-xs text-gray-500 mt-1">{a.matched_skills.length} of {a.matched_skills.length + a.missing_skills.length} skills</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Similarity</div>
            <div className="font-display text-4xl font-extrabold mt-2" data-testid="stat-similarity">{a.similarity_score}</div>
            <div className="text-xs text-gray-500 mt-1">TF-IDF cosine</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Interview readiness</div>
            <div className="font-display text-4xl font-extrabold mt-2" data-testid="stat-readiness">{a.interview_readiness}%</div>
            <div className="text-xs text-gray-500 mt-1">Combined signal</div>
          </div>
        </div>

        <div className="panel p-6 lg:col-span-3">
          <div className="font-display font-bold text-xl mb-4">Skills</div>
          <SkillGroup title="Matched" chips={a.matched_skills} variant="match" testid="skills-matched" />
          <SkillGroup title="Missing (from JD)" chips={a.missing_skills} variant="miss" testid="skills-missing" />
          <SkillGroup title="Recommended (from your resume)" chips={a.recommended_skills} variant="rec" testid="skills-recommended" />
        </div>

        <div className="panel p-6 lg:col-span-3">
          <div className="font-display font-bold text-xl mb-2">Suggestions</div>
          <p className="text-sm text-gray-500 mb-4">Rule-based ATS tips and Gemini-powered rewrites.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3">Rule-based ATS tips</div>
              <ul className="space-y-2 text-sm text-gray-300">
                {(a.suggestions?.ats || []).map((s, i) => (
                  <li key={i} className="flex gap-2" data-testid={`ats-tip-${i}`}>
                    <span className="text-blue-400">▸</span> {s}
                  </li>
                ))}
                {(a.suggestions?.ats || []).length === 0 && (
                  <li className="text-emerald-400">No critical ATS issues found. 🎯</li>
                )}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-blue-400" /> AI (Gemini)
              </div>
              <LlmSuggestions llm={a.suggestions?.llm || {}} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillGroup({ title, chips, variant, testid }) {
  if (!chips || chips.length === 0) return null;
  const cls = variant === "match" ? "chip chip-match" : variant === "miss" ? "chip chip-miss" : "chip chip-rec";
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">{title} ({chips.length})</div>
      <div className="flex flex-wrap gap-2" data-testid={testid}>
        {chips.map((s) => <span key={s} className={cls}>{s}</span>)}
      </div>
    </div>
  );
}

function LlmSuggestions({ llm }) {
  if (llm?.error) {
    return <div className="text-sm text-rose-300">LLM error: {String(llm.error).slice(0, 200)}</div>;
  }
  return (
    <div className="space-y-4 text-sm">
      {llm.professional_summary && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Suggested professional summary</div>
          <div className="text-gray-300 leading-relaxed bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">{llm.professional_summary}</div>
        </div>
      )}
      {llm.missing_keywords?.length > 0 && (
        <ChipsSection title="Missing keywords" items={llm.missing_keywords} />
      )}
      {llm.rewritten_bullets?.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Rewritten bullets</div>
          <ul className="space-y-2 text-gray-300">
            {llm.rewritten_bullets.slice(0, 5).map((r, i) => (
              <li key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">▸ {r}</li>
            ))}
          </ul>
        </div>
      )}
      {llm.grammar_fixes?.length > 0 && (
        <ChipsSection title="Grammar fixes" items={llm.grammar_fixes} />
      )}
      {llm.recommended_certifications?.length > 0 && (
        <ChipsSection title="Recommended certifications" items={llm.recommended_certifications} />
      )}
      {llm.recommended_projects?.length > 0 && (
        <ChipsSection title="Project ideas" items={llm.recommended_projects} />
      )}
      {llm.recommended_technologies?.length > 0 && (
        <ChipsSection title="Recommended tech" items={llm.recommended_technologies} />
      )}
      {Object.keys(llm).length === 0 && (
        <div className="text-gray-500 italic">No AI suggestions available yet.</div>
      )}
    </div>
  );
}

function ChipsSection({ title, items }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((c, i) => <span key={i} className="chip">{c}</span>)}
      </div>
    </div>
  );
}
