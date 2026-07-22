import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, ArrowRight } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === "admin") {
      setEmail("admin@demo.com");
      setPassword("Admin@123");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] noise-bg grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10" data-testid="login-logo">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center">
            <Zap className="w-5 h-5" />
          </div>
          <div className="font-display font-extrabold text-lg tracking-tight">ResumeIQ</div>
        </Link>
        <div className="relative z-10 max-w-md">
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold mb-4">Welcome back</div>
          <h1 className="font-display text-5xl font-extrabold tracking-tighter leading-none">
            Your ATS score,<br />in one login.
          </h1>
          <p className="text-gray-400 mt-6">Pick up where you left off. Your resumes, analyses and interview kits are waiting.</p>
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-10 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-violet-500/10 blur-3xl" />
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center">
                <Zap className="w-4 h-4" />
              </div>
              <div className="font-display font-extrabold">ResumeIQ</div>
            </Link>
          </div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight">Log in</h2>
          <p className="text-sm text-gray-500 mt-2">Enter your credentials to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-[0.15em] text-gray-400">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
                placeholder="you@work.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-[0.15em] text-gray-400">Password</Label>
                <Link to="/forgot" className="text-xs text-blue-400 hover:text-blue-300" data-testid="link-forgot">Forgot?</Link>
              </div>
              <Input
                id="password"
                type="password"
                data-testid="input-login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              data-testid="btn-login-submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500"
            >
              {loading ? "Signing in..." : (<>Log in <ArrowRight className="w-4 h-4 ml-2" /></>)}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span>Quick demo</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>
          <Button
            variant="secondary"
            onClick={() => fillDemo("admin")}
            data-testid="btn-fill-admin"
            className="w-full mt-3 h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10"
          >
            Fill admin credentials
          </Button>

          <div className="mt-8 text-sm text-gray-500 text-center">
            No account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300" data-testid="link-signup">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
