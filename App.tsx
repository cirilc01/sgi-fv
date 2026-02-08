import React, { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { UserRole } from "./types";

export const supabase = createClient(
  "https://ktrrrqaqaljdcmxqdcff.supabase.co",
  "sb_publishable_ZcEU2_K18A4NU43hO4zPmA_N5SkuqO_"
);

function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setLoading(false);
      return;
    }

    const user = data.session.user;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          role: "user"
        })
        .select()
        .single();

      setCurrentUser(newProfile);
    } else {
      setCurrentUser(profile);
    }

    setLoading(false);
  }

  if (loading) return null;

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login setCurrentUser={setCurrentUser} />
            )
          }
        />

        <Route
          path="/register"
          element={
            currentUser ? (
              <Navigate to="/dashboard" />
            ) : (
              <Register />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            currentUser ? (
              currentUser.role === UserRole.ADMIN ? (
                <AdminDashboard currentUser={currentUser} />
              ) : (
                <UserDashboard currentUser={currentUser} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
