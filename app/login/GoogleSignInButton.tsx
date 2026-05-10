import { signIn } from "@/auth";

export function GoogleSignInButton() {
  async function handleSignIn() {
    "use server";
    await signIn("google", { redirectTo: "/markets" });
  }
  return (
    <form action={handleSignIn}>
      <button type="submit" className="evs-btn-primary w-full">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#fff"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
          />
          <path
            fill="#fff"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.93v2.32A9 9 0 0 0 9 18z"
          />
          <path
            fill="#fff"
            d="M3.97 10.71a5.41 5.41 0 0 1 0-3.42V4.97H.93a9 9 0 0 0 0 8.06l3.04-2.32z"
          />
          <path
            fill="#fff"
            d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0a9 9 0 0 0-8.07 4.97l3.04 2.32C4.68 5.16 6.66 3.58 9 3.58z"
          />
        </svg>
        Sign in with Google
      </button>
    </form>
  );
}
