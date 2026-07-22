import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import AppLayout from "@/components/AppLayout";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import UploadResume from "@/pages/UploadResume";
import ResumeHistory from "@/pages/ResumeHistory";
import Analysis from "@/pages/Analysis";
import Interview from "@/pages/Interview";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import AdminDashboard from "@/pages/AdminDashboard";

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0a0d14]">
        <div className="animate-pulse text-gray-400">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/app" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ForgotPassword />} />

            <Route
              path="/app"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/app/upload"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <UploadResume />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/app/history"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <ResumeHistory />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/app/analysis/:id"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Analysis />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/app/interview"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Interview />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/app/profile"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/app/admin"
              element={
                <PrivateRoute adminOnly>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </PrivateRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
