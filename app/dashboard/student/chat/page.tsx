import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { ChatHistoryClient } from "./ChatHistoryClient";

export default async function ChatHistoryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch tutor notes as chat placeholder
  // In a full implementation, this would be a dedicated ChatMessage model
  const tutorNotes = await prisma.tutorNote.findMany({
    where: {
      studentId: user.id,
      visibility: "EXTERNAL", // Only show external notes (visible to students/parents)
    },
    include: {
      tutor: {
        select: {
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch chat messages (if they exist)
  const chatMessages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: user.id },
        { recipientId: user.id },
      ],
    },
    include: {
      sender: {
        select: {
          name: true,
          role: true,
        },
      },
      recipient: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <Header
        user={{ name: user.name!, email: user.email!, role: user.role }}
        title="Chat History"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard/student" },
          { label: "Chat" },
        ]}
      />

      <main className="container mx-auto px-4 py-8 flex-1">
        <ChatHistoryClient
          tutorNotes={tutorNotes}
          chatMessages={chatMessages}
          studentId={user.id}
        />
      </main>
    </div>
  );
}
