import { ReactNode } from "react";
import StaffSidebar from "./StaffSidebar";

interface Props {
  children: ReactNode;
}

export default function StaffLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <StaffSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          <div className="max-w-[1200px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
