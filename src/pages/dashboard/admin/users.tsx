import Head from "next/head";
import { withAuth } from "@components/templates/withAuth";
import AdminLayout from "@components/organisms/AdminDashboard/AdminLayout";
import UserManagement from "@components/organisms/UserManagement/UserManagement";

function UsersPage() {
  return (
    <AdminLayout title="Quản lý Người Dùng | MetroNext">
      <UserManagement />
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

export default withAuth(UsersPage, { allowedRoles: ["admin"] });
