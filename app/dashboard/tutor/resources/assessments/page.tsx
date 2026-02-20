import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { ClipboardCheck, Plus, ExternalLink } from "lucide-react";

export default async function AssessmentToolsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  const rubrics = await prisma.assessmentRubric.findMany({
    where: {
       course: {
         centerId: user.centerId
       }
    },
    include: {
      course: { select: { title: true } }
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Assessment Tools" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assessment Tools</h1>
            <p className="text-gray-600 dark:text-gray-400">Rubrics, grading templates, and evaluation criteria</p>
          </div>
          <Link href="/dashboard/tutor/assessments/create" className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Assessment
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Rubrics Section */}
           <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <div className="p-6 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                 <ClipboardCheck className="text-blue-500 h-5 w-5" /> Standard Rubrics
               </h2>
             </div>
             <div className="divide-y divide-gray-50 dark:divide-gray-700">
               {rubrics.map(rubric => (
                 <div key={rubric.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="font-bold text-gray-900 dark:text-white">{rubric.name}</h3>
                       <p className="text-xs text-gray-500 mt-1">{rubric.course.title} • Max Score: {rubric.maxScore}</p>
                     </div>
                     <button className="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                   </div>
                 </div>
               ))}
               {rubrics.length === 0 && <div className="p-10 text-center text-gray-500">No rubrics defined yet.</div>}
             </div>
           </div>

           {/* Quick Resources */}
           <div className="space-y-6">
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-2xl text-white shadow-lg">
               <h2 className="text-2xl font-bold mb-4">Grading Best Practices</h2>
               <p className="opacity-90 mb-6 text-sm leading-relaxed">
                 Consistently apply rubrics to ensure fair evaluation across all students.
                 Provide actionable feedback that helps students understand their specific areas for improvement.
               </p>
               <button className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-bold text-sm flex items-center gap-2">
                 Read Guide <ExternalLink className="h-4 w-4" />
               </button>
             </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
               <h3 className="font-bold text-gray-900 dark:text-white mb-4">Diagnostic Tools</h3>
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                   <span className="text-sm font-medium">Initial Reading Level Test</span>
                   <button className="text-blue-600 text-xs font-bold">Launch</button>
                 </div>
                 <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                   <span className="text-sm font-medium">Numeracy Placement Exam</span>
                   <button className="text-blue-600 text-xs font-bold">Launch</button>
                 </div>
               </div>
             </div>
           </div>
        </div>
      </main>
    </div>
  );
}
