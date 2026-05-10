import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { oauthEnabled } from "@/auth";
import { LoginForm } from "./LoginForm";
import { GoogleSignInButton } from "./GoogleSignInButton";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/markets");

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      <h1 className="font-display font-extrabold text-3xl evs-display-gradient mb-1">
        Sign in
      </h1>
      <p className="text-evs-muted text-sm mb-8">
        {oauthEnabled
          ? "Sign in with Google to start trading."
          : "Local mode — pick any display name."}
      </p>
      {oauthEnabled ? <GoogleSignInButton /> : <LoginForm />}
    </div>
  );
}
