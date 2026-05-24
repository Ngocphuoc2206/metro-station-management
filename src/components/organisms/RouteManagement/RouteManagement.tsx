/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { routeApi } from "@features/route/routeApi";
import { Route } from "@features/route/routeTypes";
import RouteList from "./RouteList";
import StationSequence from "./StationSequence";
import RouteOperatingParams from "./RouteOperatingParams";
import RouteFormModal from "./RouteFormModal";

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<Route | null>(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      const data = await routeApi.getRoutes();
      setRoutes(data);
      if (data.length > 0 && !selectedRouteId) {
        setSelectedRouteId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Khi chọn tuyến → fetch GET /routes/{id} để lấy stations
  useEffect(() => {
    if (!selectedRouteId) {
      setSelectedRouteDetail(null);
      return;
    }
    setLoadingDetail(true);
    routeApi.getRouteById(selectedRouteId)
      .then((detail) => {
        setSelectedRouteDetail(detail);
        // Cập nhật stationsCount trong danh sách tuyến bên trái
        setRoutes((prev) =>
          prev.map((r) =>
            r.id === detail.id
              ? { ...r, stationsCount: detail.stations?.length ?? detail.stationsCount }
              : r
          )
        );
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [selectedRouteId]);

  const selectedRoute = selectedRouteDetail ?? routes.find((r) => r.id === selectedRouteId) ?? null;

  const handleCreateOrUpdateRoute = async (formData: any) => {
    try {
      if (routeToEdit) {
        const updated = await routeApi.updateRoute(routeToEdit.id, {
          ...formData,
          stations: formData.stations, // từ station picker
        });
        setRoutes((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
      } else {
        const newRoute = await routeApi.createRoute({
          name: formData.name,
          routeCode: formData.routeCode,
          color: formData.color,
          status: formData.status,
          description: formData.description || "",
          startTime: "05:00",
          endTime: "23:00",
          headwayMinutes: 10,
          // stations từ station picker — BE yêu cầu có ít nhất 1 ga
          stations: formData.stations,
        });
        setRoutes([...routes, newRoute]);
        setSelectedRouteId(newRoute.id);
      }
      setIsModalOpen(false);
      setRouteToEdit(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi tạo/cập nhật tuyến");
    }
  };

  const handleUpdateSequence = async (newStations: any[]) => {
    if (!selectedRouteId) return;
    try {
      const updated = await routeApi.updateRoute(selectedRouteId, {
        stations: newStations,
        stationsCount: newStations.length,
      });
      setRoutes((prev) =>
        prev.map((r) => (r.id === selectedRouteId ? updated : r)),
      );
    } catch (e) {
      console.error(e);
      alert("Lỗi cập nhật lộ trình");
    }
  };

  const handleUpdateParams = async (updates: Partial<Route>) => {
    if (!selectedRouteId) return;
    try {
      const updated = await routeApi.updateRoute(selectedRouteId, updates);
      setRoutes((prev) =>
        prev.map((r) => (r.id === selectedRouteId ? updated : r)),
      );
    } catch (e) {
      console.error(e);
      alert("Lỗi cập nhật thông số");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
            Quản lý tuyến & lộ trình
          </h1>
          <nav className="text-xs text-gray-400">
            <span>Admin</span>
            <span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Tuyến</span>
          </nav>
        </div>

        <button
          onClick={() => {
            setRouteToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Thêm tuyến mới
        </button>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-180px)]">
        {/* Left: Route List */}
        <div className="w-full lg:w-[320px] shrink-0 overflow-y-auto h-full pr-2 custom-scrollbar">
          <RouteList
            routes={routes}
            selectedId={selectedRouteId}
            onSelect={setSelectedRouteId}
            onEditClick={(id) => {
              const route = routes.find((r) => r.id === id);
              if (route) {
                setRouteToEdit(route);
                setIsModalOpen(true);
              }
            }}
          />
        </div>

        {/* Middle & Right Wrapper */}
        {selectedRoute ? (
          <div className="flex-1 flex flex-col xl:flex-row gap-6 h-full w-full">
            {/* Middle: Sequence */}
            {loadingDetail ? (
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Đang tải lộ trình...</p>
                </div>
              </div>
            ) : (
              <StationSequence
                stations={selectedRoute?.stations ?? []}
                routeColor={selectedRoute?.color ?? "#3b82f6"}
                onUpdate={handleUpdateSequence}
              />
            )}

            {/* Right: Params */}
            <div className="shrink-0 h-full overflow-y-auto px-1">
              <RouteOperatingParams
                route={selectedRoute}
                onUpdate={handleUpdateParams}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl h-full">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <h3 className="text-gray-900 font-bold mb-1">Chưa chọn Tuyến</h3>
              <p className="text-sm text-gray-500">
                Vui lòng chọn một loại tuyến xe ở bảng bên trái để xem chi tiết.
              </p>
            </div>
          </div>
        )}
      </div>

      <RouteFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRouteToEdit(null);
        }}
        route={routeToEdit}
        onSubmit={handleCreateOrUpdateRoute}
      />
    </div>
  );
}
