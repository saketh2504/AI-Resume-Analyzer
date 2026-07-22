import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, hint, accent = "blue", testid }) {
  const accents = {
    blue: "from-blue-500/20 to-blue-500/0 text-blue-400",
    green: "from-emerald-500/20 to-emerald-500/0 text-emerald-400",
    yellow: "from-yellow-500/20 to-yellow-500/0 text-yellow-400",
    red: "from-rose-500/20 to-rose-500/0 text-rose-400",
    violet: "from-violet-500/20 to-violet-500/0 text-violet-400",
    cyan: "from-cyan-500/20 to-cyan-500/0 text-cyan-400",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel card-lift p-6 relative overflow-hidden"
      data-testid={testid}
    >
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${accents[accent]} blur-2xl opacity-70 pointer-events-none`} />
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-white/[0.05] grid place-items-center mb-4">
          <Icon className={`w-5 h-5 ${accents[accent].split(" ").pop()}`} />
        </div>
      )}
      <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">{label}</div>
      <div className="font-display text-4xl font-extrabold mt-2 tracking-tighter">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </motion.div>
  );
}
