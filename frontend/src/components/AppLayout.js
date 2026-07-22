import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Upload,
  History,
  MessageSquare,
  Sparkles,
  User,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  Zap,
} from "lucide-react";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", end: true },
  { to: "/app/upload", label: "Upload Resume", icon: Upload, testid: "nav-upload" },
  { to: "/app/history", label: "Resume History", icon: History, testid: "nav-history" },
  { to: "/app/interview", label: "Interview Prep", icon: MessageSquare, testid: "nav-interview" },
  { to: "/app/profile", label: "Profile", icon: User, testid: "nav-profile" },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon, testid: "nav-settings" },
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const doLogout = () => {
    logout();
    nav("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] noise-bg text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-white/[0.06] bg-[#0a0d14]/80 backdrop-blur-xl sticky top-0 h-screen">
        <Link to="/app" className="flex items-center gap-2 px-6 py-6" data-testid="sidebar-logo">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg leading-none">ResumeIQ</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">AI Screening</div>
          </div>
        </Link>

        <nav className="flex flex-col gap-1 px-3 mt-2">
          {NAV.map(({ to, label, icon: Icon, testid, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-testid={testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors duration-200 ${
                  isActive
                    ? "bg-blue-500/15 text-white border border-blue-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/app/admin"
              data-testid="nav-admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors duration-200 ${
                  isActive
                    ? "bg-violet-500/15 text-white border border-violet-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                }`
              }
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="mt-auto p-4">
          <div className="panel p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 grid place-items-center text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate" data-testid="sidebar-user-name">{user?.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10"
              onClick={doLogout}
              data-testid="btn-logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 glass px-4 py-3 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 grid place-items-center">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-display font-bold">ResumeIQ</span>
        </Link>
        <Button size="sm" variant="ghost" onClick={doLogout} data-testid="btn-logout-mobile">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:pt-0 pt-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 md:py-12">{children}</div>
      </main>
    </div>
  );
}
