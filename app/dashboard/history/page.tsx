import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";

interface FormSubmission {
  id: string;
  domainName: string;
  status?: string;
  createdAt: Date;
  formTemplate?: {
    name: string;
  };
}

export default async function FormHistoryPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin");
  }
  
  // Get user data with form submissions
  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      formSubmissions: {
        orderBy: { createdAt: "desc" },
        include: { formTemplate: true },
      },
    },
  });
  
  if (!user) {
    redirect("/auth/signin");
  }
  
  const formSubmissions = user.formSubmissions as FormSubmission[];

  return (
    <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">Form History</h1>
      
      <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Form Submissions</h2>
          <p className="mt-1 text-sm text-gray-500">Forms you've filled with ZappForm</p>
        </div>
        <div className="border-t border-gray-200">
          <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-500">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">Website</div>
              <div className="col-span-3">Form Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">Actions</div>
            </div>
          </div>
          <ul role="list" className="divide-y divide-gray-200">
            {formSubmissions.length > 0 ? (
              formSubmissions.map((submission) => (
                <li key={submission.id} className="px-4 py-4 text-sm text-gray-900">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4 truncate">
                      {submission.domainName}
                    </div>
                    <div className="col-span-3 truncate">
                      {submission.formTemplate?.name || "Unknown form"}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${submission.status === "COMPLETED" ? "bg-green-100 text-green-800" : 
                          submission.status === "FAILED" ? "bg-red-100 text-red-800" : 
                          "bg-blue-100 text-blue-800"}`}
                      >
                        {submission.status || "COMPLETED"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-8 text-sm text-gray-500 text-center">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No form submissions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Install the ZappForm browser extension to start filling forms automatically.
                </p>
                <div className="mt-6">
                  <a
                    href="/chrome-extension.zip"
                    download
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Download Extension
                  </a>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
      
      {formSubmissions.length > 0 && (
        <div className="mt-6 bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Form Analytics</h2>
            <p className="mt-1 text-sm text-gray-500">Statistics about your form filling activity</p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Total Forms Filled</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{formSubmissions.length}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Most Common Website</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formSubmissions.length > 0
                    ? (() => {
                        const domains = formSubmissions.map((s: FormSubmission) => s.domainName);
                        const counts: Record<string, number> = domains.reduce((acc: Record<string, number>, domain: string) => {
                          acc[domain] = (acc[domain] || 0) + 1;
                          return acc;
                        }, {});
                        const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                        return mostCommon ? mostCommon[0] : 'N/A';
                      })()
                    : 'N/A'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Time Saved</dt>
                <dd className="mt-1 text-sm text-gray-900">~{formSubmissions.length * 5} minutes</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
} 