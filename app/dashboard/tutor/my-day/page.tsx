import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { MyDayClient } from "./MyDayClient";

export default async function TutorMyDayPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch initial data
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/academic/tutor/my-day`,
    {
      headers: {
        Cookie: `next-auth.session-token=${session}`, // Pass session for SSR
      },
      cache: "no-store", // Always fetch fresh data
    }
  ).catch(() => null);

  const initialData = response?.ok ? await response.json() : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="My Day"
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <MyDayClient initialData={initialData} tutorName={user.name!} />
      </main>
    </div>
  );
}
