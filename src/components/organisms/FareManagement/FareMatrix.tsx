import { useState, useEffect, useMemo } from "react";
import { fareApi } from "@features/fare/fareApi";
import { Zone, FareMatrixData } from "@features/fare/fareTypes";

export default function FareMatrix() {
  const [data, setData] = useState<FareMatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for matrix editing
  const [isEditing, setIsEditing] = useState(false);
  const [matrixState, setMatrixState] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fareApi.getFareMatrix();
      setData(res);
      initMatrixState(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const initMatrixState = (d: FareMatrixData) => {
    const newState: Record<string, string> = {};
    d.rules.forEach((r) => {
      // Format number to "15.000"
      newState[`${r.fromZoneId}-${r.toZoneId}`] = r.price.toLocaleString("vi-VN").replace(/,/g, ".");
    });
    setMatrixState(newState);
    setErrors({});
  };

  // Handle cell text change
  const handleCellChange = (fromId: string, toId: string, value: string) => {
    // Only allow numbers and maybe dots
    if (/[^\d.]/.test(value)) return;

    setMatrixState((prev) => ({
      ...prev,
      [`${fromId}-${toId}`]: value,
    }));

    // Auto-sync reverse route (A->B = B->A) if user wants, but AC says "trừ khi được cấu hình thủ công khác đi".
    // For simplicity, we just sync immediately for an impressive demo, or let them manually edit. We'll leave it manual to allow asymmetric pricing if needed.
  };

  const validateMatrix = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;
    
    if (!data) return false;

    data.zones.forEach((row) => {
      data.zones.forEach((col) => {
        if (row.id === col.id) return; // Diagonal is always 0
        const key = `${row.id}-${col.id}`;
        const valStr = matrixState[key];
        
        // Remove dots to parse
        const num = Number(valStr?.replace(/\./g, ""));
        if (isNaN(num) || valStr === "" || num < 0) {
          newErrors[key] = true;
          isValid = false;
        }
      });
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateMatrix() || !data) return;

    setSaving(true);
    try {
      // Re-build rules array
      const newRules = data.rules.map((r) => {
        const valStr = matrixState[`${r.fromZoneId}-${r.toZoneId}`];
        return {
          ...r,
          price: Number(valStr.replace(/\./g, "")),
        };
      });

      const updated = await fareApi.updateFareMatrix({
        ...data,
        rules: newRules,
      });

      setData(updated);
      setIsEditing(false); // turn off edit mode on success
    } catch (e) {
      console.error(e);
      alert("Khổng thể lưu bảng giá!");
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const newZoneId = `z${data.zones.length + 1}`;
      const newZoneName = `Zone ${data.zones.length + 1}`;
      
      const updatedZones = [...data.zones, { id: newZoneId, name: newZoneName, order: data.zones.length + 1 }];
      const newRules = [...data.rules];
       
      // Create new rules cross-referencing all existing zones
      data.zones.forEach((exZone) => {
        newRules.push({ id: `rule-${exZone.id}-${newZoneId}`, fromZoneId: exZone.id, toZoneId: newZoneId, price: 0 });
        newRules.push({ id: `rule-${newZoneId}-${exZone.id}`, fromZoneId: newZoneId, toZoneId: exZone.id, price: 0 });
      });
      // Diagonal for new zone
      newRules.push({ id: `rule-${newZoneId}-${newZoneId}`, fromZoneId: newZoneId, toZoneId: newZoneId, price: 0 });

      const updatedData = await fareApi.updateFareMatrix({
        ...data,
        zones: updatedZones,
        rules: newRules
      });
      
      setData(updatedData);
      initMatrixState(updatedData);
      setIsEditing(true); // Tự động mở edit để nhập dữ liệu cho zone mới
    } catch (e) {
      console.error(e);
      alert("Lỗi khi thêm Zone mới");
    } finally {
      setLoading(false);
    }
  };

  // Render Loader
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Left: Matrix Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-w-0">
        <div className="p-5 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={handleAddZone}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm Zone
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 tracking-wider">CHẾ ĐỘ CHỈNH SỬA</span>
              <button
                type="button"
                onClick={() => {
                   if (isEditing) {
                     // Want to cancel editing, re-init state
                     initMatrixState(data);
                   }
                   setIsEditing(!isEditing);
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEditing ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEditing ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-medium">Cập nhật lần cuối: {data.lastUpdated}</span>
        </div>

        <div className="p-5 overflow-x-auto">
          <table className="w-full text-sm text-center border-separate border-spacing-y-3">
            <thead>
              <tr>
                <th className="px-4 py-2 text-xs font-semibold text-gray-400 tracking-wider uppercase text-left w-24">TỪ \ ĐẾN</th>
                {data.zones.map((col) => (
                  <th key={col.id} className="px-4 py-2 font-bold text-blue-900 w-28 uppercase text-[13px]">
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.zones.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-bold text-gray-900 text-left bg-white">{row.name}</td>
                  {data.zones.map((col) => {
                    const isDiagonal = row.id === col.id;
                    const key = `${row.id}-${col.id}`;
                    const hasError = errors[key];

                    if (isDiagonal) {
                      return (
                        <td key={col.id} className="px-2">
                          <div className="h-10 w-full flex items-center justify-center font-bold text-blue-500 bg-blue-50/50 rounded-xl">
                            0
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} className="px-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={matrixState[key] || ""}
                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                            className={`w-full h-10 text-center font-medium rounded-xl border focus:outline-none focus:ring-2 transition-colors ${
                              hasError
                                ? "border-red-400 bg-red-50 text-red-700 focus:ring-red-200"
                                : "border-gray-200 text-gray-700 focus:border-blue-400 focus:ring-blue-100"
                            }`}
                          />
                        ) : (
                          <div className="h-10 w-full flex items-center justify-center font-medium text-gray-700 border border-gray-100 rounded-xl bg-gray-50">
                            {matrixState[key]}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit mode floating action bar */}
        {isEditing && (
          <div className="p-4 bg-blue-50 border-t border-blue-100 flex items-center justify-between rounded-b-2xl">
            <span className="text-sm text-blue-800 font-medium">Bạn đang ở chế độ chỉnh sửa. Thay đổi chưa được lưu.</span>
            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditing(false); initMatrixState(data); }}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition bg-white border border-gray-200 rounded-xl disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50 min-w-[140px] justify-center"
              >
                {saving ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                ) : (
                  "Lưu bảng giá"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: Info Sidebar */}
      <div className="w-full xl:w-80 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-bold text-gray-900">Quy tắc tính giá</h3>
          </div>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            Bảng giá zone-to-zone được cấu hình dựa trên khoảng cách địa lý và mật độ các trạm trong zone đó.
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">ONE</div>
              <p className="text-sm text-gray-700"><span className="font-semibold text-blue-900">Giá cơ bản:</span> 15.000 VND cho mỗi 2 zone di chuyển đầu tiên.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <p className="text-sm text-gray-700"><span className="font-semibold text-gray-900">Phụ phí zone:</span> 5.000 VND cho mỗi zone tiếp theo.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-sm text-gray-700"><span className="font-semibold text-indigo-900">Giờ cao điểm:</span> Hệ số x1.2 áp dụng tự động vào khung giờ 07:00-09:00 và 16:30-18:30.</p>
            </div>
          </div>
        </div>

        <div className="bg-transparent pl-4 border-l-2 border-amber-400">
          <h4 className="font-bold text-gray-900 text-sm mb-2">Lưu ý:</h4>
          <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4 marker:text-gray-300">
            <li>Các ô có màu đỏ thể hiện dữ liệu bị thiếu hoặc không hợp lệ.</li>
            <li>Giá trị 0 chỉ áp dụng cho giao điểm chéo của cùng một zone.</li>
            <li>Hệ thống sẽ không tự động đồng bộ giá vé đảo chiều (A→B và B→A) trừ khi được cấu hình thủ công.</li>
          </ul>
        </div>

        <button className="flex items-center justify-center gap-2 w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl transition border border-gray-200 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lịch sử thay đổi
        </button>
      </div>
    </div>
  );
}
