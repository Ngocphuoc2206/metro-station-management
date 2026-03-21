import type { ReactNode } from "react";
import { History, ScanLine, Ticket } from "lucide-react";

type StepItem = {
  title: string;
  description: string;
  icon: ReactNode;
};

const STEPS: StepItem[] = [
  {
    title: "1. Mua vé",
    description: "Chọn ga đi, ga đến và thanh toán qua ứng dụng MetroNext.",
    icon: <Ticket aria-hidden="true" className="h-5 w-6" strokeWidth={2} />,
  },
  {
    title: "2. Quét tại cổng",
    description: "Chạm điện thoại vào vùng cảm biến tại cửa soát vé tự động.",
    icon: <ScanLine aria-hidden="true" className="h-6 w-6" strokeWidth={2} />,
  },
  {
    title: "3. Xem lịch sử",
    description: "Theo dõi lịch trình di chuyển và số dư ví điện tử của bạn.",
    icon: <History aria-hidden="true" className="h-6 w-6" strokeWidth={2} />,
  },
];

export const UserHowItWorks = () => {
  return (
    <section className="w-full bg-blue-600/5 px-6 py-16 md:px-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-12 md:px-10">
        <div className="flex w-full flex-col items-center">
          <h2 className="text-center text-3xl font-black leading-9 text-neutral-900">Quy trình hoạt động</h2>
        </div>

        <div className="grid w-full grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((step, index) => (
            <article key={step.title} className="relative flex flex-col items-center">
              {index < STEPS.length - 1 && (
                <div className="absolute left-[58%] top-8 hidden h-0.5 w-[84%] bg-blue-600/20 lg:block" />
              )}

              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0px_4px_6px_-4px_rgba(19,127,236,0.40),0px_10px_15px_-3px_rgba(19,127,236,0.40)]">
                {step.icon}
              </div>

              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-xl font-bold leading-7 text-neutral-900">{step.title}</h3>
                <p className="max-w-80 text-base font-normal leading-6 text-slate-500">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
