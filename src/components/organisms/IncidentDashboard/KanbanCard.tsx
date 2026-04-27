import React from "react";
import Link from "next/link";
import type { IncidentRecord } from "@features/incident/incidentTypes";

interface Props {
  incident: IncidentRecord;
  onDragStart: (e: React.DragEvent, incidentId: string) => void;
}

export default function KanbanCard({ incident, onDragStart }: Props) {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 text-red-600 border-red-100";
      case "warning":
      case "high":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "medium":
        return "bg-yellow-50 text-yellow-600 border-yellow-100";
      case "low":
        return "bg-green-50 text-green-600 border-green-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical": return "CRITICAL";
      case "warning":
      case "high": return "HIGH";
      case "medium": return "MEDIUM";
      case "low": return "LOW";
      default: return "";
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, incident.id)}
      className="bg-white rounded-xl shadow-sm border border-gray-100/80 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative mb-3 group"
    >
      <Link href={`/staff/incidents/${incident.id}`} className="block p-4">
        <div className="flex justify-between items-start mb-3">
          <span className={`text-[10px] font-black px-2 py-0.5 border rounded-md uppercase tracking-wider ${getSeverityStyles(incident.severity)}`}>
            {getSeverityLabel(incident.severity)}
          </span>
          <span className="text-xs text-gray-400 font-medium">{incident.createdAt}</span>
        </div>

        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
          {incident.title}
        </h3>
        
        <div className="flex items-center text-xs text-gray-500 font-medium mb-4">
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          {incident.stationId}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
          {incident.assigneeName ? (
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                 {incident.assigneeName.charAt(0)}
               </div>
               <span className="text-xs font-medium text-gray-600">{incident.assigneeName}</span>
             </div>
          ) : (
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               </div>
               <span className="text-xs font-medium text-gray-400">Chưa phân công</span>
             </div>
          )}
          
          {/* Placeholder comment icon */}
          <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </div>
      </Link>
    </div>
  );
}
