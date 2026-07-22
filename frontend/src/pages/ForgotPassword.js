import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Zap } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const request = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      if (data.reset_token) {
        setToken(data.reset_token);
        setStep(2);
        toast.success("Reset token generated. Enter a new password.");
      } else {
        toast.info(data.message || "If the email exists, we've sent instructions.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password must be 6+ characters");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      toast.success("Password updated. You can log in now.");
      setStep(3);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] noise-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center">
            <Zap className="w-5 h-5" />
          </div>
          <div className="font-display font-extrabold text-lg tracking-tight">ResumeIQ</div>
        </Link>
        <div className="panel p-8">
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Forgot password</h2>
              <p className="text-sm text-gray-500 mt-2">Enter your email to receive a reset token.</p>
              <form onSubmit={request} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs uppercase tracking-[0.15em] text-gray-400">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-forgot-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="btn-forgot-submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500"
                >
                  {loading ? "Sending..." : "Send reset token"}
                </Button>
              </form>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="font-display text-2xl font-extrabold tracking-tight">Reset password</h2>
              <p className="text-sm text-gray-500 mt-2">Token generated. Enter a new password below.</p>
              <div className="text-[11px] text-gray-500 mt-3 break-all bg-black/30 border border-white/10 rounded-lg p-3">
                Token: <span className="text-blue-300" data-testid="reset-token-display">{token}</span>
              </div>
              <form onSubmit={reset} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="new" className="text-xs uppercase tracking-[0.15em] text-gray-400">New password</Label>
                  <Input
                    id="new"
                    type="password"
                    data-testid="input-new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="mt-2 bg-black/20 border-white/10 h-11 rounded-xl focus:border-blue-500"
                  />
                </div>
                <Button
                  type="submit"
                  data-testid="btn-reset-submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500"
                >
                  {loading ? "Updating..." : "Update password"}
                </Button>
              </form>
            </>
          )}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="font-display text-2xl font-bold">Password updated!</div>
              <p className="text-gray-500 mt-2">You can now log in with your new password.</p>
              <Link to="/login" className="inline-block mt-6">
                <Button className="bg-blue-600 hover:bg-blue-500 rounded-full px-6" data-testid="btn-go-login">
                  Go to login
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500 text-center">
            Remembered it?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
