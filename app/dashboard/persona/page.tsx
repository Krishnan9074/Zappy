import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";

export default async function PersonaPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  // Get user data with AI persona
  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      aiPersona: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  const persona = user.aiPersona[0];

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">AI Persona</h1>
      
      <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">AI Persona Status</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your personal AI assistant for form filling</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
              persona?.status === "TRAINED" 
                ? "bg-green-100" 
                : persona?.status === "FAILED" 
                ? "bg-red-100" 
                : "bg-yellow-100"
            }`}>
              <svg 
                className={`h-6 w-6 ${
                  persona?.status === "TRAINED" 
                    ? "text-green-600" 
                    : persona?.status === "FAILED" 
                    ? "text-red-600" 
                    : "text-yellow-600"
                }`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {persona?.status === "TRAINED" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : persona?.status === "FAILED" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                {persona?.status === "TRAINED" 
                  ? "Ready to use" 
                  : persona?.status === "FAILED" 
                  ? "Training failed" 
                  : persona?.status === "PROCESSING"
                  ? "Training in progress"
                  : "Not trained yet"}
              </h3>
              <p className="text-sm text-gray-500">
                {persona?.status === "TRAINED" 
                  ? "Your AI persona is trained and ready to fill forms" 
                  : persona?.status === "FAILED" 
                  ? "There was an issue training your AI persona" 
                  : persona?.status === "PROCESSING"
                  ? "We're training your AI persona, this might take a few minutes"
                  : "Add more personal data or documents to train your AI persona"}
              </p>
            </div>
          </div>
          
          {!persona || persona?.status !== "TRAINED" ? (
            <div className="mt-8">
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {!persona ? "Start Training" : persona.status === "FAILED" ? "Retry Training" : "Check Progress"}
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">AI Model Details</h4>
                <dl className="mt-2 border-t border-b border-gray-200 divide-y divide-gray-200">
                  <div className="py-3 flex justify-between text-sm font-medium">
                    <dt className="text-gray-500">Model Version</dt>
                    <dd className="text-gray-900">v{persona.version}</dd>
                  </div>
                  <div className="py-3 flex justify-between text-sm font-medium">
                    <dt className="text-gray-500">Last Updated</dt>
                    <dd className="text-gray-900">{new Date(persona.updatedAt).toLocaleDateString()}</dd>
                  </div>
                  <div className="py-3 flex justify-between text-sm font-medium">
                    <dt className="text-gray-500">Confidence Score</dt>
                    <dd className="text-gray-900">{persona.confidenceScore}%</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Actions</h4>
                <div className="mt-2 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update AI Persona
                  </button>
                  <button
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Test with Sample Form
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Training Data</h2>
          <p className="mt-1 text-sm text-gray-500">Information used to train your AI persona</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Personal Information</h3>
                  <p className="text-sm text-gray-500">Basic details like name, address, etc.</p>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 px-4 py-3 sm:px-6 rounded-md">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
                <div className="mt-1 text-sm text-gray-900">Complete</div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Documents</h3>
                  <p className="text-sm text-gray-500">Resumes, IDs, and other uploads</p>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 px-4 py-3 sm:px-6 rounded-md">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
                <div className="mt-1 text-sm text-gray-900">1 Document Processed</div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-gray-900">Form History</h3>
                  <p className="text-sm text-gray-500">Previously filled forms</p>
                </div>
              </div>
              <div className="mt-4 bg-gray-50 px-4 py-3 sm:px-6 rounded-md">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</div>
                <div className="mt-1 text-sm text-gray-900">No forms filled yet</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add More Training Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 