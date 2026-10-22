import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="font-bold text-lg">
              NicheChat
            </Link>
            <div className="hidden sm:flex gap-6 text-sm font-medium text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-900">
                Chatbots
              </Link>
              <Link href="/dashboard/billing" className="hover:text-slate-900">
                Billing
              </Link>
            </div>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
