import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import PassengerShell from "@components/templates/PassengerShell";
import { CheckCircle2, Ticket } from "lucide-react";

const STEP2_STORAGE_KEY = "metro-buy-ticket-step2";
const PURCHASE_SUMMARY_KEY = "metro-passenger-purchase-summary";

type PurchaseSummary = {
  orderId: string;
  total: number;
  paidAt: string;
};

const MetroPaymentSuccessPage: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady || typeof window === "undefined") return;

    const orderId =
      typeof router.query.orderId === "string" ? router.query.orderId : "";
    if (!orderId) return;

    const rawStep2 = window.sessionStorage.getItem(STEP2_STORAGE_KEY);
    if (!rawStep2) return;

    try {
      const step2 = JSON.parse(rawStep2) as { selectedOrderTotal?: number };
      const total = Number(step2.selectedOrderTotal);
      if (!Number.isFinite(total) || total <= 0) return;

      const rawSummary = window.localStorage.getItem(PURCHASE_SUMMARY_KEY);
      const summaries: PurchaseSummary[] = rawSummary ? JSON.parse(rawSummary) : [];
      const nextSummaries = [
        { orderId, total, paidAt: new Date().toISOString() },
        ...summaries.filter((item) => item.orderId !== orderId),
      ].slice(0, 20);

      window.localStorage.setItem(
        PURCHASE_SUMMARY_KEY,
        JSON.stringify(nextSummaries),
      );
    } catch {
      // Dashboard can still rely on server data when local summary is unavailable.
    }
  }, [router.isReady, router.query.orderId]);

  return (
    <PassengerShell>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] items-center justify-center">
        <section className="w-full rounded-3xl bg-white px-5 py-10 text-center shadow-sm outline outline-1 outline-slate-200 sm:px-12 sm:py-12">
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 sm:h-20 sm:w-20" />
          <h1 className="mt-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Giao dịch thành công!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-slate-600">
            Đơn hàng của bạn đã được thanh toán thành công. Vé đã sẵn sàng
            trong mục Vé của tôi.
          </p>
          <button
            type="button"
            onClick={() => router.push("/passenger-page/my-tickets")}
            className="mx-auto mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition hover:bg-blue-700 sm:w-auto sm:px-8"
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
