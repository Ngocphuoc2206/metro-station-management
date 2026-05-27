import { useEffect, useState } from "react";
import ShiftProfileInfo from "./ShiftProfileInfo";
import ShiftStatusCard from "./ShiftStatusCard";
import WeeklySchedule from "./WeeklySchedule";
import ShiftIncidentList from "./ShiftIncidentList";
import { shiftApi } from "@features/shift/shiftApi";
import type { CurrentShiftRecord, ShiftSchedule, ShiftIncident } from "@features/shift/shiftTypes";

export default function ShiftProfileDashboard() {
  const [shiftData, setShiftData] = useState<CurrentShiftRecord | null>(null);
  const [schedule, setSchedule] = useState<ShiftSchedule[]>([]);
  const [incidents, setIncidents] = useState<ShiftIncident[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentRes, schedRes] = await Promise.allSettled([
        shiftApi.getCurrentShift(),
        shiftApi.getWeeklySchedule(),
      ]);
      if (currentRes.status === "fulfilled") setShiftData(currentRes.value);
      if (schedRes.status === "fulfilled") setSchedule(schedRes.value);
      setIncidents([]); // incidents hiện lấy riêng từ incidentApi
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await shiftApi.checkIn();
      await loadData(); // Reload to get updated state
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await shiftApi.checkOut();
      await loadData(); // Reload to get updated state
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header breadcrumb (optional) */}
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium pb-2">
        <span>Nhân viên ga</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <span className="text-blue-600 font-bold">Hồ sơ ca trực</span>
      </div>

      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">
        Hồ sơ ca trực
      </h1>

      {/* Top 3 blocks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div>
            <ShiftProfileInfo />
          </div>
          <div className="flex-1">
            <ShiftStatusCard 
              isCheckedIn={shiftData?.isCheckedIn || false}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              isLoading={loading || actionLoading}
            />
          </div>
        </div>
        <div className="lg:col-span-8 flex flex-col">
          <WeeklySchedule schedule={schedule} isLoading={loading} />
        </div>
      </div>

      {/* Bottom block */}
      <ShiftIncidentList incidents={incidents} isLoading={loading} />
      
    </div>
  );
}
