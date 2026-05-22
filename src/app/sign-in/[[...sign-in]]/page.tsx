import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex-1 flex items-center justify-center min-h-screen bg-[#08080a]">
      <SignIn />
    </main>
  );
}
