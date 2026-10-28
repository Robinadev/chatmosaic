"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, HeartHandshake, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    setBusy(true);
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        toast.error("We couldn’t complete that request. Check your details and try again.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      toast.error("We couldn’t connect to the sign-in service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <CardHeader className="auth-card-header">
          <Link className="brand auth-brand" href="/" aria-label="ChatMosaic home">
            <span className="brand-mark"><HeartHandshake aria-hidden="true" /></span>
            <span>ChatMosaic<span className="brand-period">.</span></span>
          </Link>
          <span className="auth-eyebrow">COMMUNITY KNOWLEDGE</span>
          <CardTitle className="auth-title">
            {isSignUp ? "Create your workspace" : "Welcome back"}
          </CardTitle>
          <CardDescription className="auth-description">
            {isSignUp
              ? "Bring your organization’s knowledge together in one helpful assistant."
              : "Sign in to manage your sources and assistant."}
          </CardDescription>
        </CardHeader>
        <CardContent className="auth-card-content">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="auth-fields">
              {isSignUp && (
                <Field>
                  <FieldLabel htmlFor="name">Your name</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    maxLength={100}
                    minLength={2}
                    placeholder="Alex Morgan"
                    required
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  placeholder="you@organization.org"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={8}
                  maxLength={128}
                  placeholder="At least 8 characters"
                  required
                />
                {isSignUp && (
                  <FieldDescription>
                    Use at least 8 characters. Your password is managed securely by Neon Auth.
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
            <Button className="auth-submit" type="submit" disabled={busy}>
              {busy ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}
              {isSignUp ? "Create workspace" : "Sign in"}
              {!busy ? <ArrowRight data-icon="inline-end" /> : null}
            </Button>
          </form>
          <p className="auth-switch">
            {isSignUp ? "Already have an account? " : "New to ChatMosaic? "}
            <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-privacy">Your documents are private by default.</p>
        </CardContent>
      </Card>
    </main>
  );
}
