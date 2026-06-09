import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  adminScheduleApi,
  adminScheduleErrorMessage,
  type ScheduleDirection,
  type SchedulePayload,
  type ScheduleStatus,
} from "@features/schedule/adminScheduleApi";
import type { ScheduleDto } from "@features/schedule/scheduleTypes";
import { routeApi } from "@features/route/routeApi";
import type { Route } from "@features/route/routeTypes";
import { stationApi } from "@features/station/stationApi";
import type { Station } from "@features/station/stationTypes";

type FormState = SchedulePayload;

const blankForm: FormState = {
  routeId: "",
  stationId: "",
  direction: "OUTBOUND",
  departureTime: "08:00:00",
  arrivalTime: "08:03:00",
  frequencyMinutes: 10,
  status: "ACTIVE",
};

const directionLabel: Record<string, string> = {
  OUTBOUND: "Chiều đi",
  INBOUND: "Chiều về",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Đang chạy",
  DELAYED: "Trễ",
  INACTIVE: "Tạm ngưng",
};

const toTimeWithSeconds = (value: string) => {
  if (!value) return "";
  return value.length === 5 ? `${value}:00` : value;
};

const toTimeInputValue = (value: string) => {
  if (!value) return "";
  return value.slice(0, 5);
};

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<ScheduleDto[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRouteFilter, setSelectedRouteFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const routeNameById = useMemo(
    () => new Map(routes.map((route) => [route.id, route.name])),
    [routes],
  );
  const stationNameById = useMemo(
    () => new Map(stations.map((station) => [station.id, station.name])),
    [stations],
  );

  const displayedSchedules = useMemo(() => {
    let result = schedules;
    if (selectedRouteFilter) {
      result = result.filter((schedule) => schedule.routeId === selectedRouteFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (schedule) =>
          (routeNameById.get(schedule.routeId) || "").toLowerCase().includes(s) ||
          (stationNameById.get(schedule.stationId) || "").toLowerCase().includes(s)
      );
    }
    return result;
  }, [schedules, selectedRouteFilter, search, routeNameById, stationNameById]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [routeList, stationResult, scheduleList] = await Promise.all([
        routeApi.getRoutes(),
        stationApi.getStations({}, 1, 500),
        adminScheduleApi.list(),
      ]);

      setRoutes(routeList);
      setStations(stationResult.data);
      setSchedules(scheduleList);
      setForm((current) => ({
        ...current,
        routeId: current.routeId || routeList[0]?.id || "",
        stationId: current.stationId || stationResult.data[0]?.id || "",
      }));
    } catch (err) {
      setError(adminScheduleErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setEditingScheduleId(null);
    setForm({
      ...blankForm,
      routeId: routes[0]?.id || "",
      stationId: stations[0]?.id || "",
    });
    setSuccessMessage(null);
    setError(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    if (saving) return;
    setIsFormOpen(false);
  };

  const editSchedule = (schedule: ScheduleDto) => {
    setEditingScheduleId(schedule.id);
    setForm({
      routeId: schedule.routeId,
      stationId: schedule.stationId,
      direction: (schedule.direction || "OUTBOUND") as ScheduleDirection,
      departureTime: toTimeWithSeconds(schedule.departureTime),
      arrivalTime: toTimeWithSeconds(schedule.arrivalTime),
      frequencyMinutes: schedule.frequencyMinutes || 10,
      status: (schedule.status || "ACTIVE") as ScheduleStatus,
    });
    setSuccessMessage(null);
    setError(null);
    setIsFormOpen(true);
  };

  const deleteSchedule = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch tàu này?")) return;
    try {
      await adminScheduleApi.delete(id);
      setSchedules((current) => current.filter((s) => s.id !== id));
      setSuccessMessage("Đã xóa lịch tàu.");
    } catch (err) {
      setError(adminScheduleErrorMessage(err));
    }
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload: SchedulePayload = {
      ...form,
      departureTime: toTimeWithSeconds(form.departureTime),
      arrivalTime: toTimeWithSeconds(form.arrivalTime),
      frequencyMinutes: Number(form.frequencyMinutes),
    };

    try {
      const saved = editingScheduleId
        ? await adminScheduleApi.update(editingScheduleId, payload)
        : await adminScheduleApi.create(payload);

      setSchedules((current) => {
        if (editingScheduleId) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...current];
      });
      setEditingScheduleId(saved.id);
      setSuccessMessage(
        editingScheduleId ? "Đã cập nhật lịch tàu." : "Đã thêm lịch tàu mới.",
      );
      setIsFormOpen(false);
    } catch (err) {
      setError(adminScheduleErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold leading-tight text-gray-900">
            Quản lý lịch tàu chạy
          </h1>
          <nav className="text-xs text-gray-400">
            <span>Admin</span>
            <span className="mx-1">›</span>
            <span className="font-medium text-gray-600">Lịch tàu</span>
          </nav>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm tuyến, ga..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>

        <select
          value={selectedRouteFilter}
          onChange={(event) => setSelectedRouteFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 w-auto min-w-[140px]"
        >
          <option value="">Tất cả tuyến</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.name}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 w-auto min-w-[130px]"
          defaultValue=""
        >
          <option value="">Hướng chạy</option>
          <option value="OUTBOUND">Chiều đi</option>
          <option value="INBOUND">Chiều về</option>
        </select>

        <select
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 w-auto min-w-[130px]"
          defaultValue=""
        >
          <option value="">Trạng thái</option>
          <option value="ACTIVE">Đang chạy</option>
          <option value="DELAYED">Trễ</option>
          <option value="INACTIVE">Tạm ngưng</option>
        </select>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Tìm kiếm
        </button>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm lịch tàu
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div>
        <section className="app-table-shell">

          <div className="app-table-scroll">
            <table className="app-table min-w-[900px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase text-gray-400">
                <tr>
                  <th className="px-5 py-3">Tuyến</th>
                  <th className="px-5 py-3">Ga</th>
                  <th className="px-5 py-3">Hướng</th>
                  <th className="px-5 py-3">Khởi hành</th>
                  <th className="px-5 py-3">Đến</th>
                  <th className="px-5 py-3">Tần suất</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-center w-[120px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      Đang tải lịch tàu...
                    </td>
                  </tr>
                ) : displayedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-gray-500">
                      Chưa có lịch tàu phù hợp.
                    </td>
                  </tr>
                ) : (
                  displayedSchedules.map((schedule) => (
                    <tr key={schedule.id} className="transition hover:bg-blue-50/40">
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {routeNameById.get(schedule.routeId) ?? schedule.routeId}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {stationNameById.get(schedule.stationId) ?? schedule.stationId}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {directionLabel[schedule.direction] ?? schedule.direction}
                      </td>
                      <td className="px-5 py-4 font-bold text-blue-600">
                        {schedule.departureTime}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {schedule.arrivalTime}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {schedule.frequencyMinutes} phút
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            schedule.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : schedule.status === "DELAYED"
                                ? "bg-red-50 text-red-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {statusLabel[schedule.status] ?? schedule.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => editSchedule(schedule)}
                            className="text-gray-400 hover:text-blue-600 transition"
                            title="Sửa"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSchedule(schedule.id)}
                            className="text-gray-400 hover:text-red-600 transition"
                            title="Xóa"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-xl font-bold text-gray-900">
                {editingScheduleId ? "Cập nhật lịch tàu" : "Thêm lịch tàu"}
              </h2>
              <button
                type="button"
                onClick={closeFormModal}
                disabled={saving}
                className="p-1 text-gray-400 transition hover:text-gray-600 disabled:opacity-50"
                aria-label="Đóng"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-6 pb-6">
              <form id="schedule-form" className="space-y-4" onSubmit={submitForm}>
            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Tuyến
              </span>
              <select
                required
                value={form.routeId}
                onChange={(event) => updateForm("routeId", event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn tuyến</option>
                {routes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Ga
              </span>
              <select
                required
                value={form.stationId}
                onChange={(event) => updateForm("stationId", event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Chọn ga</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Hướng
                </span>
                <select
                  value={form.direction}
                  onChange={(event) =>
                    updateForm("direction", event.target.value as ScheduleDirection)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="OUTBOUND">OUTBOUND</option>
                  <option value="INBOUND">INBOUND</option>
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Trạng thái
                </span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", event.target.value as ScheduleStatus)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Giờ khởi hành
                </span>
                <input
                  required
                  type="time"
                  step={1}
                  value={toTimeInputValue(form.departureTime)}
                  onChange={(event) =>
                    updateForm("departureTime", toTimeWithSeconds(event.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  Giờ đến
                </span>
                <input
                  required
                  type="time"
                  step={1}
                  value={toTimeInputValue(form.arrivalTime)}
                  onChange={(event) =>
                    updateForm("arrivalTime", toTimeWithSeconds(event.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Tần suất (phút)
              </span>
              <input
                required
                min={1}
                type="number"
                value={form.frequencyMinutes}
                onChange={(event) =>
                  updateForm("frequencyMinutes", Number(event.target.value))
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </label>
              </form>
            </div>

            <div className="flex flex-col-reverse gap-3 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeFormModal}
                disabled={saving}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="schedule-form"
                disabled={saving || !form.routeId || !form.stationId}
                className="flex min-w-[128px] items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Đang lưu..."
                  : editingScheduleId
                    ? "Lưu thay đổi"
                    : "Thêm lịch tàu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
