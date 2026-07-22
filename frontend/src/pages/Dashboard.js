import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import StatCard from "@/components/StatCard";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import {
  Gauge, FileText, Briefcase, Rocket, ChevronRight, Sparkles, TrendingUp,
  AlertTriangle, BadgeCheck,
} from "lucide-react";

const PIE_COLORS = ["#3b82f6", "#4ade80", "#facc15", "#a78bfa", "#f472b6", "#22d3ee", "#fb7185"];

export default function Dashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard")
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading dashboard...</div>;
  }
  if (!data) return null;

  const c = data.cards;
  const noAnalyses = data.charts.ats_history.length === 0;

  return (
    <div className="space-y-8" data-testid="dashboard-root">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Overview</div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tighter mt-2">Your resume health</h1>
          <p className="text-gray-400 mt-2">Snapshot of the latest analysis, skill trends and improvement over time.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => nav("/app/upload")} className="bg-blue-600 hover:bg-blue-500 rounded-full px-5" data-testid="btn-new-analysis">
            <Sparkles className="w-4 h-4 mr-2" /> New analysis
          </Button>
          {data.latest_analysis_id && (
            <Button
              variant="secondary"
              onClick={() => nav(`/app/analysis/${data.latest_analysis_id}`)}
              className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-full px-5"
              data-testid="btn-view-latest"
            >
              View latest <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard testid="card-ats" icon={Gauge} label="ATS Score" value={c.ats_score} hint="Latest analysis" accent="blue" />
        <StatCard testid="card-resumes" icon={FileText} label="Resumes" value={c.total_resumes} hint="Total uploads" accent="cyan" />
        <StatCard testid="card-apps" icon={Briefcase} label="Job Analyses" value={c.job_applications} hint="Analyses run" accent="violet" />
        <StatCard testid="card-readiness" icon={Rocket} label="Readiness" value={`${c.interview_readiness}%`} hint="Interview" accent="green" />
        <StatCard testid="card-skills-found" icon={BadgeCheck} label="Skills Found" value={c.skills_found} hint="Matched" accent="green" />
        <StatCard testid="card-missing-skills" icon={AlertTriangle} label="Missing Skills" value={c.missing_skills} hint="From latest JD" accent="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Chart</div>
              <div className="font-display font-bold text-xl">ATS score history</div>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="h-72" data-testid="chart-ats-history">
            {noAnalyses ? (
              <EmptyChart message="Run an analysis to see your ATS score history." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts.ats_history}>
                  <defs>
                    <linearGradient id="atsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#11141d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} labelStyle={{ color: "#9ca3af" }} />
                  <Area dataKey="score" stroke="#3b82f6" fill="url(#atsGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Chart</div>
              <div className="font-display font-bold text-xl">Skill categories</div>
            </div>
          </div>
          <div className="h-72" data-testid="chart-skill-categories">
            {data.charts.skill_categories.length === 0 ? (
              <EmptyChart message="Upload a resume to see skill categories." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.charts.skill_categories}
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {data.charts.skill_categories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0a0d14" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#11141d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Chart</div>
              <div className="font-display font-bold text-xl">Improvement trend</div>
            </div>
          </div>
          <div className="h-64" data-testid="chart-improvement-trend">
            {data.charts.improvement_trend.length === 0 ? (
              <EmptyChart message="Track improvement across multiple analyses over time." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.charts.improvement_trend}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                  <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#11141d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                  <Line type="monotone" dataKey="match_pct" name="Skill match %" stroke="#4ade80" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="readiness" name="Readiness %" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-full grid place-items-center text-sm text-gray-500 text-center px-6">
      {message}
    </div>
  );
}
