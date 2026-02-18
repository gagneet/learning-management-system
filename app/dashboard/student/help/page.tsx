import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StudentHelpClient from "./StudentHelpClient";

export default async function StudentHelpPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  // Fetch student's open help requests
  const helpRequests = await prisma.helpRequest.findMany({
    where: {
      studentId: session.user.id,
    },
    include: {
      session: {
        select: { id: true, title: true },
      },
      exercise: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <StudentHelpClient
      studentId={session.user.id}
      helpRequests={helpRequests}
    />
  );
}
