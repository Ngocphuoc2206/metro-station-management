import type { ReactNode } from "react";
import PassengerChatbotWidget from "@components/organisms/PassengerChatbot/PassengerChatbotWidget";
import PassengerHeader from "./PassengerHeader";
import PassengerSidebar from "./PassengerSidebar";

type PassengerShellProps = {
  children: ReactNode;
  searchPlaceholder?: string;
};

export default function PassengerShell({ children, searchPlaceholder }: PassengerShellProps) {
  return (
    <div className="passenger-page-shell min-h-screen w-full bg-[radial-gradient(circle_at_8%_12%,rgba(37,99,235,0.10),transparent_42%),radial-gradient(circle_at_92%_18%,rgba(16,185,129,0.10),transparent_38%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_48%,#f8fafc_100%)]">
      <div className="flex min-h-screen w-full">
        <PassengerSidebar />

        <main className="flex min-w-0 flex-1 flex-col">
          <PassengerHeader searchPlaceholder={searchPlaceholder} />

          <section className="flex-1 p-4 sm:p-8">{children}</section>
        </main>
      </div>
      <PassengerChatbotWidget />
    </div>
  );
}
