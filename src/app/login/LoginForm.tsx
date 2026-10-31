"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  // Only same-site paths: "?redirect=https://evil.example" (or "//evil…")
  // would otherwise bounce a freshly signed-in admin to a phishing page.
  const requested = searchParams.get("redirect") ?? "";
  const redirect =
    requested.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/\\")
      ? requested
      : "/admin";
  const notAdmin = searchParams.get("error") === "not_admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // A valid account isn't enough — it must carry the admin role. Sign
    // straight back out so a non-admin session doesn't linger.
    if (data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("This account doesn't have admin access. Contact the site owner if you need it.");
      setLoading(false);
      return;
    }

    // Full page navigation to go through middleware and set cookies
    window.location.href = redirect;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <Image
              src="/logo-mark.svg"
              alt="INÁ Ornamental Fish"
              width={64}
              height={64}
              className="mx-auto mb-4 rounded-xl object-contain"
            />
            <h1 className="text-2xl font-black text-slate-900">
              INÁ Admin Portal
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sign in to manage your catalogue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              aria-label="Email address"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl h-11"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                aria-label="Password"
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {(error || notAdmin) && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error ||
                  "That account doesn't have admin access. Sign in with an admin account."}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
