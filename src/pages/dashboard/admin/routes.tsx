import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import RouteManagement from "@components/organisms/RouteManagement/RouteManagement";

function RoutesPage() {
  return (
    <AdminLayout title="Quản lý Tuyến & Lộ trình | MetroNext">
      <RouteManagement />
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </AdminLayout>
  );
}

export default withAuth(RoutesPage, { allowedRoles: ["admin"] });
