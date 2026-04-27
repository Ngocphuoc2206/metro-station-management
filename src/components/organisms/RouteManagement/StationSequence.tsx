import { useState, useEffect, useRef } from "react";
import { RouteStation } from "@features/route/routeTypes";

interface Props {
  stations: RouteStation[];
  routeColor: string;
  onUpdate: (newStations: RouteStation[]) => void;
}

export default function StationSequence({ stations: initialStations, routeColor, onUpdate }: Props) {
  const [stations, setStations] = useState<RouteStation[]>(initialStations);
  const [hasChanged, setHasChanged] = useState(false);

  // Drag and Drop refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setStations(initialStations);
    setHasChanged(false);
  }, [initialStations]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    // For visual effect
    e.dataTransfer.effectAllowed = "move";
    // Slight delay to allow CSS style changes (like opacity) before drag image is captured
    setTimeout(() => {
      const el = e.target as HTMLElement;
      if (el) el.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (el) el.style.opacity = "1";

    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newStations = [...stations];
      const draggedStationContent = newStations.splice(dragItem.current, 1)[0];
      newStations.splice(dragOverItem.current, 0, draggedStationContent);

      // Re-assign sequence order
      newStations.forEach((st, i) => {
        st.sequenceOrder = i + 1;
      });

      setStations(newStations);
      setHasChanged(true);
    }
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleAddStation = () => {
    const newStation: RouteStation = {
      id: `rs_new_${Date.now()}`,
      stationId: `sta_${Date.now()}`,
      stationName: "Ga mới thêm",
      stationDetail: "Ga ngầm / Đang thi công",
      sequenceOrder: stations.length + 1,
    };
    setStations([...stations, newStation]);
    setHasChanged(true);
  };

  const handleSave = () => {
    onUpdate(stations);
    setHasChanged(false);
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[500px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h2 className="text-lg font-bold text-gray-900">Lộ trình chi tiết</h2>
        </div>
        <span className="text-xs text-gray-500 font-medium">Kéo thả để sắp xếp</span>
      </div>

      {/* Body: Station List */}
      <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
        <div className="relative">
          {/* Vertical connecting line */}
          <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-gray-200" />
          
          <div className="flex flex-col gap-4 relative z-10">
            {stations.map((st, index) => (
              <div 
                key={st.id} 
                className="flex items-center gap-4 bg-white p-3 pr-4 rounded-xl shadow-sm border border-gray-100 group transition-all"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {/* Drag Handle */}
                <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing hover:bg-gray-50 p-1 rounded">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                
                {/* Sequence Circle */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 transition-colors"
                  style={{ backgroundColor: routeColor }}
                >
                  {st.sequenceOrder}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="font-bold text-gray-900 text-sm truncate leading-tight mb-0.5">{st.stationName}</h4>
                  <p className="text-xs text-gray-500 truncate leading-tight">{st.stationDetail}</p>
                </div>
              </div>
            ))}

            {/* Empty State / Add Button */}
            <button onClick={handleAddStation} className="flex items-center gap-3 bg-transparent border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl p-3 px-4 transition-colors group mt-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-500 group-hover:text-blue-600 transition-colors">Thêm ga vào tuyến...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Context Actions */}
      <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{stations.length} Ga trong lộ trình</span>
        <div className="flex gap-3">
          <button
            disabled={!hasChanged}
            onClick={() => { setStations(initialStations); setHasChanged(false); }}
            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-transparent hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            disabled={!hasChanged}
            onClick={handleSave}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 min-w-[130px]"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
