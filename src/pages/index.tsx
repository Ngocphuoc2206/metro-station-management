import type { ReactElement } from "react";
import UserLayout from "@components/templates/UserLayout";

function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">MetroNext Frontend</h1>
      <p>Project nền đã khởi tạo thành công.</p>
    </div>
  );
}

HomePage.getLayout = function getLayout(page: ReactElement) {
  return <UserLayout title="Home">{page}</UserLayout>;
};

export default HomePage;
