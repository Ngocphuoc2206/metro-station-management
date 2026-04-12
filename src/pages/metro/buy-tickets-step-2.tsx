import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { MetroAuthHeader } from "@components/organisms/MetroAuthHeader/MetroAuthHeader";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type JourneyState = {
  originStation: string;
  destinationStation: string;
  travelDate: string;
  passengerCount: string;
  isRoundTrip: boolean;
};

const STORAGE_KEY = "metro-buy-ticket-step1";

const emptyState: JourneyState = {
  originStation: "",
  destinationStation: "",
  travelDate: "",
  passengerCount: "",
  isRoundTrip: false,
};

const formatDate = (date: string) => {
  if (!date) {
    return "-- / -- / ----";
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return "-- / -- / ----";
  }

  return `${day}/${month}/${year}`;
};

const MetroBuyTicketsStep2Page: NextPage = () => {
  const router = useRouter();
  const [journeyState, setJourneyState] = useState<JourneyState>(emptyState);

  useEffect(() => {
    const fromQuery = {
      originStation: typeof router.query.from === "string" ? router.query.from : "",
      destinationStation: typeof router.query.to === "string" ? router.query.to : "",
      travelDate: typeof router.query.date === "string" ? router.query.date : "",
      passengerCount: typeof router.query.passengers === "string" ? router.query.passengers : "",
      isRoundTrip: router.query.roundTrip === "1",
    };

    const hasAllFromQuery =
      fromQuery.originStation &&
      fromQuery.destinationStation &&
      fromQuery.travelDate &&
      fromQuery.passengerCount;

    if (hasAllFromQuery) {
      setJourneyState(fromQuery);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const rawData = window.sessionStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return;
    }

    try {
      const parsed = JSON.parse(rawData) as JourneyState;
      if (
        parsed.originStation &&
        parsed.destinationStation &&
        parsed.travelDate &&
        parsed.passengerCount
      ) {
        setJourneyState(parsed);
      }
    } catch {
      setJourneyState(emptyState);
    }
  }, [router.query]);

  const hasJourneyState = useMemo(() => {
    return (
      journeyState.originStation &&
      journeyState.destinationStation &&
      journeyState.travelDate &&
      journeyState.passengerCount
    );
  }, [journeyState]);

  return (
    <div className="min-h-screen bg-slate-50">
      <MetroAuthHeader />

      <main className="mx-auto w-full max-w-[1200px] px-6 py-8 md:px-10">
        <div className="rounded-xl bg-white p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline outline-1 outline-slate-200">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-neutral-900">Bước 2: Loại vé</h1>
            <Link
              href="/metro/buy-tickets-step-1"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại bước 1
            </Link>
          </div>

          {hasJourneyState ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                Dữ liệu hành trình đã được giữ sang bước 2
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Ga đi</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{journeyState.originStation}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Ga đến</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{journeyState.destinationStation}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Ngày đi</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{formatDate(journeyState.travelDate)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Hành khách</p>
                  <p className="mt-1 text-sm font-medium text-neutral-900">{journeyState.passengerCount}</p>
                </div>
              </div>

              <p className="text-sm text-slate-600">
                Khứ hồi: <span className="font-medium text-neutral-900">{journeyState.isRoundTrip ? "Có" : "Không"}</span>
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Chưa có dữ liệu hành trình. Vui lòng quay lại bước 1 để chọn đầy đủ thông tin.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MetroBuyTicketsStep2Page;
