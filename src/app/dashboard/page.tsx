import type { Metadata } from "next";
import { Background } from "@/components/Background";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Dashboard · Moneytwin" };

export default function DashboardPage() {
  return (
    <>
      <Background />
      <Dashboard />
    </>
  );
}
