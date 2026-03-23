import type { ReactNode } from "react";
import { LayoutDashboard, UserRound, UsersRound } from "lucide-react";

type RoleCard = {
  title: string;
  description: string;
  icon: ReactNode;
};

const ROLE_CARDS: RoleCard[] = [
  {
    title: "Hành khách",
    description:
      "Di chuyển thuận tiện với ứng dụng mua vé, tra cứu lịch trình và quản lý chi phí đi lại dễ dàng.",
    icon: <UserRound aria-hidden="true" className="h-6 w-6" strokeWidth={2} />,
  },
  {
    title: "Nhân viên ga",
    description:
      "Công cụ hỗ trợ soát vé, quản lý luồng khách và báo cáo sự cố tại ga một cách nhanh chóng.",
    icon: <UsersRound aria-hidden="true" className="h-7 w-8" strokeWidth={2} />,
  },
  {
    title: "Quản trị viên",
    description:
      "Hệ thống Dashboard theo dõi toàn bộ dữ liệu vận hành, doanh thu và thống kê khách hàng toàn tuyến.",
    icon: <LayoutDashboard aria-hidden="true" className="h-7 w-7" strokeWidth={2} />,
  },
];

export const UserRoleShowcase = () => {
  return (
    <section className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-16 px-6 py-16 lg:px-10 lg:py-20">
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-black leading-9 text-neutral-900">Dành cho mọi đối tượng</h2>
        <div className="w-full max-w-[672px]">
          <p className="text-base font-normal leading-6 text-slate-500">
            Tối ưu hóa trải nghiệm cho hành khách và nâng cao hiệu suất làm việc cho đội ngũ vận hành.
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-3">
        {ROLE_CARDS.map((card) => (
          <article
            key={card.title}
            className="flex h-full flex-col items-center rounded-2xl bg-white p-8 text-center outline outline-1 outline-slate-200"
          >
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              {card.icon}
            </div>

            <h3 className="pb-3 text-xl font-bold leading-7 text-neutral-900">{card.title}</h3>

            <p className="max-w-72 text-sm font-normal leading-5 text-slate-500">{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
