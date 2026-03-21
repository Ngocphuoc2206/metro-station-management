import type { ReactNode } from "react";
import { QrCode, ScanLine, ShieldAlert } from "lucide-react";

type FeatureItem = {
  title: string;
  description: string;
  icon: ReactNode;
};

const FEATURES: FeatureItem[] = [
  {
    title: "Vé điện tử QR",
    description:
      "Mua và sử dụng vé ngay trên điện thoại di động mà không cần tiền mặt hay vé giấy.",
    icon: <QrCode aria-hidden="true" className="h-6 w-6" strokeWidth={2} />,
  },
  {
    title: "Soát vé tự động",
    description:
      "Hệ thống cửa soát vé tự động nhận diện và xử lý luồng khách hàng cực nhanh.",
    icon: <ScanLine aria-hidden="true" className="h-7 w-7" strokeWidth={2} />,
  },
  {
    title: "Quản lý sự cố ga",
    description:
      "Hệ thống báo cáo và điều phối xử lý sự cố tức thời qua trung tâm quản lý.",
    icon: <ShieldAlert aria-hidden="true" className="h-6 w-7" strokeWidth={2} />,
  },
];

export const UserFeature = () => {
  return (
    <section id="features" className="mx-auto inline-flex w-full max-w-[1120px] flex-col items-start gap-10">
      <div className="flex w-full flex-col items-center gap-4 text-center">
        <div className="text-sm font-bold uppercase leading-5 tracking-wider text-blue-600">
          Ưu điểm vượt trội
        </div>

        <h2 className="text-3xl font-black leading-9 text-neutral-900">Tính năng nổi bật</h2>

        <div className="flex w-full max-w-[600px] flex-col items-center px-4">
          <p className="text-base font-normal leading-6 text-slate-500">
            Giải pháp toàn diện cho vận hành metro hiện đại với công nghệ quản lý tập trung
          </p>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        {FEATURES.map((item) => (
          <article
            key={item.title}
            className="flex h-full flex-col items-start gap-4 rounded-3xl bg-white p-8 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-300"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600">
              {item.icon}
            </div>

            <div className="flex w-full flex-col items-start gap-1.5">
              <h3 className="text-xl font-bold leading-7 text-neutral-900">{item.title}</h3>
              <p className="text-sm font-normal leading-6 text-slate-500">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
