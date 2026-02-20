import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

export default async function SupervisorFinancialPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role !== "CENTER_SUPERVISOR" && user.role !== "CENTER_ADMIN" && user.role !== "FINANCE_ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch financial data
  const [invoices, payments, recentTransactions] = await Promise.all([
    prisma.invoice.findMany({
      where: { centreId: user.centerId },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.payment.findMany({
      where: { centreId: user.centerId },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    prisma.financialTransaction.findMany({
      where: { centerId: user.centerId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50
    })
  ]);

  const totalRevenue = recentTransactions
    .filter(t => t.type.includes("PAYMENT"))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={{ name: user.name!, email: user.email!, role: user.role }} title="Financial Reports" />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Detailed revenue and expense tracking for your center</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="text-green-600 h-6 w-6" />
              </div>
              <span className="flex items-center text-green-600 text-sm font-bold">
                <ArrowUpRight className="h-4 w-4 mr-1" /> +12%
              </span>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Monthly Revenue</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${totalRevenue.toLocaleString()}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Clock className="text-blue-600 h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Pending Invoices</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{invoices.filter(i => i.status === 'SENT').length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <ArrowDownRight className="text-red-600 h-6 w-6" />
              </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Outstanding Balance</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              ${invoices.reduce((sum, i) => sum + Number(i.balance), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{t.user.name}</div>
                      <div className="text-xs text-gray-500">{t.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                        t.type.includes("PAYMENT") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {t.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      ${t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs ${t.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
