import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { PlayCircle, Image as ImageIcon, Music } from "lucide-react";

export default async function MediaLibraryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: session.user.name!, email: session.user.email!, role: session.user.role }} title="Media Library" />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Media Library</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <PlayCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Video Content Coming Soon</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <ImageIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">Images & Diagrams Coming Soon</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <Music className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <p className="text-gray-500">Audio Resources Coming Soon</p>
          </div>
        </div>
      </main>
    </div>
  );
}
