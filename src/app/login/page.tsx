"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Loader2,
  ScanLine,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password. Please try again.");
        setIsLoading(false);
      } else {
        // Redirect based on role if no callbackUrl
        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          // Fetch session to get role
          const sessionRes = await fetch("/api/auth/session");
          const session = await sessionRes.json();
          const role = session?.user?.role || 6;
          const roleRoutes: Record<number, string> = {
            1: "/admin", 2: "/admin", 3: "/department",
            4: "/school", 5: "/school", 6: "/school",
            7: "/teacher", 8: "/student", 9: "/guard",
          };
          router.push(roleRoutes[role] || "/admin");
        }
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {/* subtle gradient bg */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-violet-50/50" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl -z-10" />

      {/* back to home */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
          <Link href="/">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to website
          </Link>
        </Button>
      </div>

      {/* login card */}
      <Card className="w-full max-w-[400px] shadow-xl border bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pt-8 pb-2">
          {/* school logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="/anhs-logo.png"
              alt="ANHS Logo"
              width={72}
              height={72}
              className="rounded-full shadow-md ring-2 ring-indigo-100"
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to the ANHS Portal
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-8 pt-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">
                Username or Email
              </Label>
              <Input
                id="username"
                name="username"
                placeholder="e.g. juan@anhs.edu.ph"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                required
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="h-11 rounded-xl pr-11 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-muted-foreground uppercase tracking-wider">or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-11 rounded-xl gap-2 text-sm font-medium" asChild>
            <Link href="/survey/demo">
              <ScanLine className="h-4 w-4 text-indigo-600" />
              Submit feedback via QR
            </Link>
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            New school?{" "}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              Register here
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-5 rounded-2xl bg-indigo-50/80 border border-indigo-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="rounded-full bg-indigo-600 text-white text-[10px] px-2 py-0.5 font-semibold">
                DEMO
              </Badge>
              <span className="text-xs text-indigo-700/70 font-medium">Test accounts</span>
            </div>
            <div className="space-y-1 text-xs text-indigo-600/70 font-mono leading-relaxed">
              <p>admin@demo.com / demo123</p>
              <p>teacher@demo.com / demo123</p>
              <p>student@demo.com / demo123</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* footer text */}
      <p className="mt-6 text-xs text-muted-foreground text-center">
        &copy; {new Date().getFullYear()} Agusan National High School &middot; Powered by Sanhay
      </p>
    </div>
  );
}
