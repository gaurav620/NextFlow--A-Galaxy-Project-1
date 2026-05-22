import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-screen bg-neutral-100">
      <SignUp />
    </main>
  );
}
