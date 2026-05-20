import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="flex-1 flex items-center justify-center bg-[#fafafa]">
      <SignUp />
    </main>
  );
}
