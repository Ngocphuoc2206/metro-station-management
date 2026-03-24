import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MetroAuthHeader } from "@components/organisms/MetroAuthHeader/MetroAuthHeader";
import { ArrowLeft, CreditCard } from "lucide-react";

type Step2State = {
  selectedTicketId?: string;
  selectedTicketName?: string;
  selectedTicketPrice?: number;
};

const STEP2_STORAGE_KEY = "metro-buy-ticket-step2";

const formatCurrency = (amount: number) => {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}đ`;
};

const MetroBuyTicketsStep3Page: NextPage = () => {
  const router = useRouter();
  const [step2State, setStep2State] = useState<Step2State>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawStep2 = window.sessionStorage.getItem(STEP2_STORAGE_KEY);
    if (!rawStep2) {
      return;
    }

    try {
      const parsed = JSON.parse(rawStep2) as Step2State;
      setStep2State(parsed);
    } catch {
      setStep2State({});
    }
  }, []);

  const ticketTypeFromQuery = typeof router.query.ticketType === "string" ? router.query.ticketType : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <MetroAuthHeader />

      <main className="mx-auto w-full max-w-[1200px] px-6 py-8 md:px-10">
        <div className="rounded-xl bg-white p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200">
          <h1 className="text-3xl font-black text-neutral-900">Bước 3: Thanh toán</h1>
          <p className="mt-2 text-sm text-slate-600">Trang thanh toán chi tiết sẽ được dựng ở bước tiếp theo.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Loại vé từ query</p>
              <p className="mt-1 text-sm font-medium text-neutral-900">{ticketTypeFromQuery || "Chưa có"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Loại vé từ state</p>
              <p className="mt-1 text-sm font-medium text-neutral-900">{step2State.selectedTicketName || "Chưa có"}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Giá vé</p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {typeof step2State.selectedTicketPrice === "number"
                  ? formatCurrency(step2State.selectedTicketPrice)
                  : "Chưa có"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
            >
              <CreditCard className="h-4 w-4" />
              Thanh toán mẫu
            </button>
            <Link
              href="/metro/buy-tickets-step-2"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 px-5 py-3 text-sm font-semibold text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại bước 2
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetroBuyTicketsStep3Page;
