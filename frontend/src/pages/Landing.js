import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Zap,
  FileScan,
  Target,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  BarChart3,
  ArrowRight,
  Check,
} from "lucide-react";

const FEATURES = [
  { icon: FileScan, title: "Deep Resume Parsing", desc: "PDF & DOCX parsing with entity extraction — name, skills, education, projects." },
  { icon: Target, title: "ATS Compatibility", desc: "0-100 score across 8 parameters with color-coded suggestions." },
  { icon: Sparkles, title: "AI Rewrites", desc: "Gemini-powered bullet rewrites, missing keywords and a tailored summary." },
  { icon: MessageSquare, title: "Interview Generator", desc: "Technical, behavioral, HR, coding and project questions with model answers." },
  { icon: BarChart3, title: "Live Analytics", desc: "Track ATS history, skill categories and improvement trend over time." },
  { icon: ShieldCheck, title: "Private & Secure", desc: "JWT auth, encrypted transport, your resumes never leave your account." },
];

const TIERS = [
  { name: "Starter", price: "$0", tag: "Free forever", features: ["3 resumes", "3 analyses/month", "Basic ATS score", "Community support"], cta: "Start free", highlight: false },
  { name: "Pro", price: "$19", tag: "Most popular", features: ["Unlimited resumes", "Unlimited analyses", "Full AI suggestions", "Interview generator", "Priority support"], cta: "Go Pro", highlight: true },
  { name: "Team", price: "$49", tag: "For recruiters", features: ["Everything in Pro", "Team seats (up to 5)", "Admin analytics", "Bulk processing", "SLA support"], cta: "Contact sales", highlight: false },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center">
              <Zap className="w-5 h-5" />
            </div>
            <div className="font-display font-extrabold text-lg tracking-tight">ResumeIQ</div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
            <a href="#features" className="hover:text-white transition-colors" data-testid="link-features">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors" data-testid="link-pricing">Pricing</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" data-testid="btn-nav-login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/[0.05]">Log in</Button>
            </Link>
            <Link to="/signup" data-testid="btn-nav-signup">
              <Button className="bg-blue-600 hover:bg-blue-500 rounded-full px-5">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-20 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-7">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs uppercase tracking-[0.2em] text-blue-300 bg-blue-500/5">
              <Sparkles className="w-3 h-3" /> Gemini-powered
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.02] mt-6">
              Beat the bots.<br />
              <span className="text-blue-400">Land the interview.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-xl leading-relaxed">
              Upload your resume, paste any job description, and get an ATS score, missing skills,
              AI-rewritten bullets and a full interview kit in under 30 seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" data-testid="btn-hero-signup">
                <Button className="bg-blue-600 hover:bg-blue-500 rounded-full px-7 h-12 text-base">
                  Analyze my resume <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login" data-testid="btn-hero-login">
                <Button variant="secondary" className="bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-full px-7 h-12 text-base">
                  Try demo login
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> No credit card</div>
              <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> PDF & DOCX</div>
              <div className="flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> 30-sec analysis</div>
            </div>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="md:col-span-5">
          <div className="panel p-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="flex items-center justify-between mb-5">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-bold">Live preview</div>
              <div className="chip chip-match">ATS 82</div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Match</div>
                <div className="mt-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 1.2 }} className="h-full bg-gradient-to-r from-blue-500 to-emerald-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Readiness</div>
                  <div className="font-display text-2xl font-extrabold">76%</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Similarity</div>
                  <div className="font-display text-2xl font-extrabold">0.64</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["React","TypeScript","Python","FastAPI","AWS"].map((s) => (
                  <span key={s} className="chip chip-match">{s}</span>
                ))}
                {["Kubernetes","GraphQL"].map((s) => (
                  <span key={s} className="chip chip-miss">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Features</div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tighter mt-3">
            Everything you need to<br />ship a stronger resume.
          </h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="panel card-lift p-6"
              data-testid={`feature-${i}`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 grid place-items-center mb-4">
                <Icon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="font-display font-bold text-xl">{title}</div>
              <div className="text-sm text-gray-400 mt-2 leading-relaxed">{desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="max-w-2xl">
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Pricing</div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tighter mt-3">Simple, honest pricing.</h2>
          <p className="text-gray-400 mt-3">Start free. Upgrade when you're ready.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <div key={t.name} className={`panel p-8 relative ${t.highlight ? "border-blue-500/40 ring-1 ring-blue-500/20" : ""}`} data-testid={`tier-${t.name.toLowerCase()}`}>
              {t.highlight && (
                <div className="absolute -top-3 left-8 chip chip-match">{t.tag}</div>
              )}
              <div className="font-display font-bold text-xl">{t.name}</div>
              <div className="mt-4 flex items-baseline gap-2">
                <div className="font-display text-5xl font-extrabold tracking-tighter">{t.price}</div>
                <div className="text-sm text-gray-500">/mo</div>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="block mt-8">
                <Button className={`w-full h-11 rounded-full ${t.highlight ? "bg-blue-600 hover:bg-blue-500" : "bg-white/[0.05] hover:bg-white/[0.1] border border-white/10"}`}>
                  {t.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/[0.05] mt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div>© 2026 ResumeIQ. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
