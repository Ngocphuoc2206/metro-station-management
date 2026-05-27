import type { NextPage } from "next";
import { useRouter } from "next/router";
import PassengerShell from "@components/templates/PassengerShell";
import { CheckCircle2, Ticket } from "lucide-react";

const MetroPaymentSuccessPage: NextPage = () => {
  const router = useRouter();

  return (
    <PassengerShell>
      <div className="mx-auto flex min-h-[65vh] w-full max-w-[720px] items-center justify-center">
        <section className="w-full rounded-3xl bg-white px-6 py-12 text-center shadow-sm outline outline-1 outline-slate-200 sm:px-12">
          <CheckCircle2 className="mx-auto h-20 w-20 text-emerald-500" />
          <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
            Giao dịch thành công!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
            Đơn hàng của bạn đã được thanh toán thành công. Vé đã sẵn sàng
            trong mục Vé của tôi.
          </p>
          <button
            type="button"
            onClick={() => router.push("/passenger-page/my-tickets")}
            className="mx-auto mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white transition hover:bg-blue-700"
          >
            <Ticket className="h-5 w-5" />
            Xem vé ngay
          </button>
        </section>
      </div>
    </PassengerShell>
  );
};

export default MetroPaymentSuccessPage;
