import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { MyDayClient } from "./MyDayClient";
import { getTutorMyDayData } from "@/lib/academic/tutor-actions";

export default async function TutorMyDayPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "TEACHER") {
    redirect("/dashboard");
  }

  // Fetch initial data directly from the database utility
  // ⚡ Bolt Optimization: Avoid internal fetch call to eliminate network overhead
  // and potential server-to-server request delays.
  let initialData = null;
  if (user.centerId) {
    initialData = await getTutorMyDayData(user.id, user.centerId).catch(
      (err) => {
        console.error("Failed to fetch initial My Day data:", err);
        return null;
      }
    );
  } else {
    console.warn("User has no centerId assigned");
  }

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
