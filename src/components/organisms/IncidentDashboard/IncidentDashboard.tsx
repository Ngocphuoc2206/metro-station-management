/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import IncidentFilterBar from "./IncidentFilterBar";
import IncidentKanbanView from "./IncidentKanbanView";
import IncidentTableView from "./IncidentTableView";
import CreateIncidentModal from "./CreateIncidentModal";
import { incidentApi } from "@features/incident/incidentApi";
import type {
  IncidentFilterParams,
  IncidentRecord,
  IncidentStatus,
} from "@features/incident/incidentTypes";

export default function IncidentDashboard() {
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [filters, setFilters] = useState<IncidentFilterParams>({
    stationId: "all",
    deviceType: "all",
    severity: "all" as any,
  });

  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // Re-fetch khi filter thay đổi

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function loadIncidents() {
    setLoading(true);
    try {
      const data = await incidentApi.getIncidents(filters);
      setIncidents(data);
    } catch (error) {
      console.error("Failed to load incidents", error);
    } finally {
      setLoading(false);
    }
  }

  const handleStatusChange = async (
    incidentId: string,
    newStatus: IncidentStatus,
  ) => {
    // Optimistic UI update
    setIncidents((prev) =>
      prev.map((i) => (i.id === incidentId ? { ...i, status: newStatus } : i)),
    );

    try {
      await incidentApi.updateIncidentStatus(incidentId, newStatus);
    } catch (e) {
      console.error(e);
      // Revert if failed
      loadIncidents();
    }
  };

  return (
    <div className="max-w-[1400px] h-full flex flex-col space-y-6">
      {/* Header + Filter ở trên cùng */}
      <div className="shrink-0">
        <IncidentFilterBar
          viewMode={viewMode}
          onChangeView={setViewMode}
          filters={filters}
          onFilterChange={setFilters}
          onOpenCreate={() => setIsCreateOpen(true)}
        />
      </div>

      {/* Main Content Area (Kanban or Table) */}
      <div className="flex-1 min-h-[500px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400 font-medium animate-pulse text-lg">
              Đang tải dữ liệu...
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          <IncidentKanbanView
            incidents={incidents}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <IncidentTableView incidents={incidents} />
        )}
      </div>

      <CreateIncidentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadIncidents}
      />
    </div>
  );
}
