import Link from "next/link";

type UserHeroProps = {
  buyTicketHref: string;
  statsText?: string;
};

export const UserHero = ({ buyTicketHref, statsText }: UserHeroProps) => {
  return (
    <section className="mx-auto inline-flex w-full max-w-[1120px] flex-col items-center justify-start gap-8 lg:flex-row">
      <div className="flex flex-1 flex-col items-start justify-center gap-6">
        <div className="flex w-full flex-col items-start gap-4">
          <h1 className="w-full text-4xl font-black leading-tight text-neutral-900 sm:text-5xl lg:text-6xl lg:leading-[60px]">
            Đi lại Metro nhanh
            <br />
            - Vé điện tử tiện lợi
          </h1>

          <p className="w-full text-base font-normal leading-7 text-slate-500 sm:text-lg">
            Hệ thống quản lý nhà ga và vé điện tử thông minh giúp hành
            <br className="hidden lg:block" />
            trình của bạn trở nên đơn giản, hiện đại và an toàn hơn bao giờ
            <br className="hidden lg:block" />
            hết.
          </p>

          {statsText ? (
            <p className="w-full text-sm font-semibold leading-6 text-slate-600">
              {statsText}
            </p>
          ) : null}
        </div>

        <div className="inline-flex w-full flex-wrap items-start justify-start gap-4">
          <Link
            href={buyTicketHref}
            className="flex h-12 min-w-36 items-center justify-center rounded-3xl bg-blue-600 px-7 text-base font-bold leading-6 text-white transition-colors hover:bg-blue-700"
          >
            <span className="inline-flex flex-col items-center justify-start overflow-hidden">
              <span className="h-6 w-20 text-center">Mua vé</span>
            </span>
          </Link>

          <Link
            href="#about"
            className="flex h-12 min-w-36 items-center justify-center rounded-3xl bg-slate-200 px-6 text-base font-bold leading-6 text-neutral-900 transition-colors hover:bg-slate-300"
          >
            <span className="inline-flex flex-col items-center justify-start overflow-hidden">
              <span className="h-6 w-28 text-center">Tìm hiểu thêm</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-start justify-start">
        <div className="relative h-[22rem] w-full self-stretch overflow-hidden rounded-3xl bg-gradient-to-br from-slate-200 via-blue-100 to-blue-300 shadow-2xl lg:h-96">
          <div className="absolute inset-0 rounded-3xl bg-white/0 shadow-2xl" />
        </div>
      </div>
    </section>
  );
};
