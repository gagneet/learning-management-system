import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MultiStudentSessionPage from "@/components/session/MultiStudentSessionPage";

interface VideoSessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VideoSessionPage({ params }: VideoSessionPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  // Fetch session with all related data
  const sessionData = await prisma.session.findUnique({
    where: { id },
    include: {
      studentEnrollments: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              academicProfile: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
      tutor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!sessionData) {
    notFound();
  }

  // Check authorization
  const isTutor = sessionData.tutorId === user.id;
  const isEnrolledStudent = sessionData.studentEnrollments.some(
    (enrollment) => enrollment.studentId === user.id
  );
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (!isTutor && !isEnrolledStudent && !isSuperAdmin) {
    redirect("/dashboard");
  }

  // Check if video room exists - if not, redirect to create it
  if (!sessionData.videoRoomUrl && isTutor) {
    // Auto-create video room for tutors
    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_URL}/api/sessions/${id}/video/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Reload page to get updated session data
        redirect(`/dashboard/tutor/sessions/${id}/video`);
      }
    } catch (error) {
      console.error("Failed to create video room:", error);
    }
  }

  // If video room doesn't exist and user is not tutor, show waiting message
  if (!sessionData.videoRoomUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-xl font-semibold text-gray-800 mb-4">
            Video session not yet started
          </p>
          <p className="text-gray-600">
            Please wait for the tutor to start the video session.
          </p>
        </div>
      </div>
    );
  }

  // Generate video token for current user
  let videoToken = "";
  try {
    const tokenResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/sessions/${id}/video/token`,
      {
        headers: {
          Cookie: `authjs.session-token=${session}`, // Pass session cookie
        },
      }
    );

    if (tokenResponse.ok) {
      const data = await tokenResponse.json();
      videoToken = data.token;
    }
  } catch (error) {
    console.error("Failed to generate video token:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-xl font-semibold text-gray-800 mb-4">
            Unable to join video session
          </p>
          <p className="text-gray-600">
            Failed to generate video access token. Please try again.
          </p>
        </div>
      </div>
    );
  }

  // Prepare student data
  const students = sessionData.studentEnrollments.map((enrollment) => ({
    id: enrollment.student.id,
    name: enrollment.student.name || "Unknown",
    email: enrollment.student.email,
    gradeLevel: enrollment.student.academicProfile?.chronologicalAge
      ? `Grade ${Math.floor(enrollment.student.academicProfile.chronologicalAge)}`
      : "Student",
    enrollmentId: enrollment.id,
    courseTitle: enrollment.course?.title || "Unknown Course",
    currentExercise: enrollment.exerciseContent
      ? JSON.parse(enrollment.exerciseContent as string)?.title
      : undefined,
    progress: enrollment.completed ? 100 : 0,
    status: (enrollment.completed ? "COMPLETED" : (enrollment.joinedAt ? "WORKING" : "NOT_STARTED")) as "COMPLETED" | "NOT_STARTED" | "WORKING" | "WAITING_HELP" | "IDLE",
    sessionTime: Math.floor((enrollment.activeMs || 0) / 1000),
    totalTime: Math.floor((enrollment.activeMs || 0) / 1000),
  }));

  return (
    <MultiStudentSessionPage
      session={{
        id: sessionData.id,
        title: sessionData.title,
        status: sessionData.status,
        startTime: sessionData.startTime,
        duration: sessionData.duration || 60,
        videoRoomUrl: sessionData.videoRoomUrl || undefined,
        videoRoomId: sessionData.videoRoomId || undefined,
        students,
      }}
      videoToken={videoToken}
      isTutor={isTutor}
      tutorName={sessionData.tutor.name || "Unknown Tutor"}
    />
  );
}
