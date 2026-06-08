/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef, useEffect } from "react";
import type { IncidentRecord } from "@features/incident/incidentTypes";
import { incidentApi } from "@features/incident/incidentApi";
import toast from "react-hot-toast";
interface Props {
  incident: IncidentRecord;
  onClose: () => void;
  onStatusUpdated: () => void;
  /** Base64 data URLs đã lưu từ lần xử lý trước (persist qua đóng/mở modal) */
  evidenceImages: string[];
  /** Gọi khi hoàn thành — lưu base64 lên IncidentDashboard để persist */
  onEvidenceSaved: (incidentId: string, dataUrls: string[]) => void;
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function toShortCode(id: string): string {
  const match = id.match(/\d+/);
  if (match) return `SC${String(parseInt(match[0], 10)).padStart(3, "0")}`;
  return id.slice(0, 6).toUpperCase();
}
/** Đọc File → base64 data URL (không bị expire như Object URL) */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// ── Shared Badge Components ───────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    critical: { label: "Nguy cấp", cls: "bg-red-600 text-white" },
    high: { label: "Cao", cls: "bg-red-600 text-white" },
    medium: { label: "Trung bình", cls: "bg-orange-400 text-white" },
    low: { label: "Thấp", cls: "bg-gray-200 text-gray-700" },
  };
  const v = map[severity] ?? map.low;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${v.cls}`}>
      {(severity === "high" || severity === "critical") && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 19H3L12 3l9 16z" />
        </svg>
      )}
      {v.label}
    </span>
  );
}
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    Open: { label: "Tạo mới", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
    Assigned: { label: "Đã phân công", cls: "bg-blue-50 text-blue-600 border border-blue-200" },
    InProgress: { label: "Đang xử lý", cls: "bg-orange-50 text-orange-600 border border-orange-200" },
    Escalated: { label: "Đang xử lý", cls: "bg-orange-50 text-orange-600 border border-orange-200" },
    Resolved: { label: "Đã hoàn thành", cls: "bg-green-50 text-green-700 border border-green-200" },
    Closed: { label: "Đã đóng", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
  };
  const v = map[status] ?? map.Open;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${v.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {v.label}
    </span>
  );
}
// ── View Modal ────────────────────────────────────────────────────────────────
function ViewModal({
  incident,
  shortCode,
  onClose,
  evidenceImages,
}: {
  incident: IncidentRecord;
  shortCode: string;
  onClose: () => void;
  evidenceImages: string[];
}) {
  const [detailDesc, setDetailDesc] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  useEffect(() => {
    incidentApi
      .getIncidentById(incident.id)
      .then((d) => setDetailDesc(d.description ?? incident.description ?? null))
      .catch(() => setDetailDesc(incident.description ?? null))
      .finally(() => setLoadingDetail(false));
  }, [incident.id, incident.description]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">Chi tiết sự cố {shortCode}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-[150px_1fr] gap-y-3.5 text-sm">
            <span className="text-gray-500 font-medium">Mã sự cố:</span>
            <span className="font-semibold text-gray-900">{shortCode}</span>
            <span className="text-gray-500 font-medium">Tên sự cố:</span>
            <span className="font-semibold text-gray-900">{incident.title}</span>
            <span className="text-gray-500 font-medium align-top pt-0.5">Mô tả chi tiết:</span>
            <span className="text-gray-700 leading-relaxed">
              {loadingDetail ? (
                <span className="inline-block w-40 h-4 bg-gray-100 rounded animate-pulse" />
              ) : detailDesc ? (
                detailDesc
              ) : (
                <span className="text-gray-400 italic">Không có mô tả</span>
              )}
            </span>
            <span className="text-gray-500 font-medium">Mức độ:</span>
            <div><SeverityBadge severity={incident.severity} /></div>
            <span className="text-gray-500 font-medium">Trạng thái hiện tại:</span>
            <div><StatusBadge status={incident.status} /></div>
          </div>
          {/* Ảnh bằng chứng xử lý (base64 – persist qua đóng/mở) */}
          {evidenceImages.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Hình ảnh bằng chứng xử lý
              </p>
              <div className="space-y-2">
                {evidenceImages.map((src, i) => (
                  <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
                    <img src={src} alt={`evidence-${i + 1}`} className="w-full object-cover max-h-56" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
// ── Processing Modal ──────────────────────────────────────────────────────────
function ProcessingModal({
  incident,
  shortCode,
  onClose,
  onCompleted,
}: {
  incident: IncidentRecord;
  shortCode: string;
  onClose: () => void;
  onCompleted: (base64Urls: string[]) => void;
}) {
  const [note, setNote] = useState("");
  // Simpan sebagai {file, preview objectURL, dataUrl base64}
  const [files, setFiles] = useState<{ file: File; objectUrl: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.objectUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(
      (f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024,
    );
    if (valid.length !== incoming.length) toast.error("Chỉ chấp nhận ảnh JPG/PNG dưới 10MB");
    const entries = valid.map((f) => ({ file: f, objectUrl: URL.createObjectURL(f) }));
    setFiles((prev) => [...prev, ...entries]);
  };
  const removeFile = (idx: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[idx].objectUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (note.trim()) await incidentApi.addTimelineComment(incident.id, note.trim());
      await incidentApi.updateIncidentStatus(incident.id, "Resolved");
      toast.success("Đã hoàn thành xử lý sự cố!");
      // Chuyển sang base64 để persist qua đóng/mở modal
      const dataUrls = await Promise.all(files.map((f) => readFileAsDataUrl(f.file)));
      onCompleted(dataUrls);
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 19H3L12 3l9 16z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900">Chi tiết xử lý sự cố {shortCode}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mã sự cố</div>
              <div className="font-bold text-blue-600">{shortCode}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Trạng thái hiện tại</div>
              <StatusBadge status={incident.status} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tên sự cố</div>
              <div className="font-semibold text-gray-900">{incident.title}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mô tả chi tiết</div>
              <div className="text-gray-700 text-xs leading-relaxed">{incident.description || "—"}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mức độ</div>
              <SeverityBadge severity={incident.severity} />
            </div>
          </div>
          <div className="border-t border-gray-100" />
          {/* Report */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-bold text-gray-900 text-sm">Báo cáo kết quả xử lý</span>
            </div>
            {/* Upload */}
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-2">Hình ảnh bằng chứng xử lý</div>
              <input
                type="file"
                accept="image/png,image/jpeg"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
              />
              <div
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
                }}
              >
                <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <p className="text-xs font-semibold text-gray-500 mb-0.5">Tải lên hình ảnh báo cáo kết quả xử lý</p>
                <p className="text-xs text-gray-400">Kéo thả file hoặc nhấn để chọn (Max 10MB)</p>
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {files.map(({ objectUrl }, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={objectUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute top-0.5 right-0.5 bg-white/90 text-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Note */}
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">Ghi chú xử lý</div>
              <textarea
                rows={4}
                placeholder="Nhập chi tiết các bước đã thực hiện..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition resize-none placeholder-gray-400"
              />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang xử lý...
              </>
            ) : (
              "Hoàn thành sự cố"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
// ── Main Router ───────────────────────────────────────────────────────────────
export default function IncidentDetailModal({
  incident,
  onClose,
  onStatusUpdated,
  evidenceImages,
  onEvidenceSaved,
}: Props) {
  const shortCode = toShortCode(incident.id);
  const [justCompleted, setJustCompleted] = useState(false);
  const isProcessing =
    !justCompleted &&
    (incident.status === "InProgress" ||
      incident.status === "Escalated" ||
      incident.status === "Assigned");
  const handleCompleted = (base64Urls: string[]) => {
    // Lưu lên IncidentDashboard (persist qua đóng/mở modal)
    onEvidenceSaved(incident.id, base64Urls);
    setJustCompleted(true);
    onStatusUpdated();
  };
  if (isProcessing) {
    return (
      <ProcessingModal
        incident={incident}
        shortCode={shortCode}
        onClose={onClose}
        onCompleted={handleCompleted}
      />
    );
  }
  return (
    <ViewModal
      incident={justCompleted ? { ...incident, status: "Resolved" } : incident}
      shortCode={shortCode}
      onClose={onClose}
      evidenceImages={evidenceImages}
    />
  );
}
