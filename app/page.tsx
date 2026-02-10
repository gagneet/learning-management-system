export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Learning Management System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            A comprehensive platform for managing courses, users, and learning content
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Multi-Tenant Support
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Support for multiple centers or tenants under one instance with isolated data and management
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Role-Based Access
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive RBAC with Admin, Center Admin, Teacher/Tutor, and Student roles
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Rich Content
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Upload and manage documents, videos, PDFs, SCORM, and xAPI content
              </p>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Key Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  📚 Course Management
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Create and manage course hierarchies with modules and lessons
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  👥 User Onboarding
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Streamlined user registration and role assignment
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  📊 Analytics Dashboard
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Comprehensive analytics for administrators and educators
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="font-semibold text-lg mb-2 text-blue-600 dark:text-blue-400">
                  🎯 Progress Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Monitor student progress and course completion
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
