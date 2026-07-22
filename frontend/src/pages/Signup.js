import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap, ArrowRight } from "lucide-react";

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be 6+ characters");
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created! Welcome to ResumeIQ.");
      nav("/app");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] noise-bg grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden">
        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center">
            <Zap className="w-5 h-5" />
          </div>
          <div className="font-display font-extrabold text-lg tracking-tight">ResumeIQ</div>
        </Link>
        <div className="relative z-10 max-w-md">
          <div className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold mb-4">Join free</div>
          <h1 className="font-display text-5xl font-extrabold tracking-tighter leading-none">
            30 seconds to your<br />first ATS score.
          </h1>
          <p className="text-gray-400 mt-6">No credit card. No spam. Just clean, honest resume feedback.</p>
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">Create your account</h2>
          <p className="text-sm text-gray-500 mt-2">Start your first analysis in under a minute.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs uppercase tracking-[0.15em] text-gray-400">Full name</Label>
              <Input
                id="name"
                data-testid="input-signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-[0.15em] text-gray-400">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
                placeholder="you@work.com"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-[0.15em] text-gray-400">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
                placeholder="At least 6 characters"
              />
            </div>
            <Button
              type="submit"
              data-testid="btn-signup-submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500"
            >
              {loading ? "Creating..." : (<>Create account <ArrowRight className="w-4 h-4 ml-2" /></>)}
            </Button>
          </form>

          <div className="mt-8 text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300" data-testid="link-login">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
