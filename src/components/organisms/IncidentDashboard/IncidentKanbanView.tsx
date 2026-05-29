import React, { useState } from "react";
import type { IncidentRecord, KanbanColumnKey, IncidentStatus } from "@features/incident/incidentTypes";
import KanbanCard from "./KanbanCard";

interface Props {
  incidents: IncidentRecord[];
  onStatusChange: (incidentId: string, newStatus: IncidentStatus) => void;
}

const COLUMNS: { key: KanbanColumnKey; label: string; mappedStatuses: IncidentStatus[]; targetStatus: IncidentStatus; colorClass: string; dotClass: string }[] = [
  { key: "TODO", label: "MỚI MỞ", mappedStatuses: ["Open", "Assigned"], targetStatus: "Open", colorClass: "text-gray-900", dotClass: "bg-gray-300" },
  { key: "IN_PROGRESS", label: "ĐANG XỬ LÝ", mappedStatuses: ["InProgress", "Escalated"], targetStatus: "InProgress", colorClass: "text-blue-600", dotClass: "bg-blue-500" },
  { key: "RESOLVED", label: "ĐÃ XỬ LÝ", mappedStatuses: ["Resolved"], targetStatus: "Resolved", colorClass: "text-green-600", dotClass: "bg-green-500" },
  { key: "CLOSED", label: "ĐÃ ĐÓNG", mappedStatuses: ["Closed"], targetStatus: "Closed", colorClass: "text-slate-800", dotClass: "bg-slate-800" },
];

export default function IncidentKanbanView({ incidents, onStatusChange }: Props) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnKey | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, colKey: KanbanColumnKey) => {
    e.preventDefault();
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: IncidentStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!draggedId) return;

    onStatusChange(draggedId, targetStatus);
    setDraggedId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {COLUMNS.map(col => {
        const colIncidents = incidents.filter(i => col.mappedStatuses.includes(i.status));
        const isOver = dragOverCol === col.key;

        return (
          <div 
            key={col.key} 
            className="flex-shrink-0 w-80 bg-gray-50/50 rounded-2xl flex flex-col h-full overflow-hidden border border-gray-100"
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.targetStatus)}
          >
            <div className="p-4 border-b border-gray-200/50 flex items-center justify-between bg-white/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.dotClass}`} />
                <h2 className={`text-xs font-black tracking-wider ${col.colorClass}`}>
                  {col.label}
                </h2>
                <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                  {colIncidents.length}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 font-bold p-1">...</button>
            </div>

            <div className={`p-3 flex-1 overflow-y-auto transition-colors ${isOver ? "bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-b-2xl m-1 p-2" : ""}`}>
              {colIncidents.length === 0 && (
                <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center p-6 text-center">
                  <span className="text-xs font-medium text-gray-400">
                    Kéo thả thẻ vào đây để cập nhật trạng thái
                  </span>
                </div>
              )}
              {colIncidents.map(incident => (
                <KanbanCard 
                  key={incident.id} 
                  incident={incident} 
                  onDragStart={handleDragStart} 
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
