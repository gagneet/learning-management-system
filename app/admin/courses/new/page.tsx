import { redirect } from "next/navigation";

export default function AdminCoursesNewPage() {
  // Redirect to the existing course creation page
  redirect("/courses/create");
}
