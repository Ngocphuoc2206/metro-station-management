import { Station } from "@features/station/stationTypes";
import { useEffect, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  station: Station | null;
  onConfirm: () => void;
}

export default function DeactivateConfirmModal({
  isOpen,
  onClose,
  station,
  onConfirm,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus lock or escape key to close would go here in a real app
  useEffect(() => {
    if (isOpen) setIsSubmitting(false);
  }, [isOpen]);

  if (!isOpen || !station) return null;

  const isDeactivating = station.status === "active";
  const actionText = isDeactivating ? "Tạm ngưng" : "Kích hoạt";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    // Simulate delay or call actual API in the parent
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDeactivating ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isDeactivating ? (
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Xác nhận {actionText.toLowerCase()}
          </h3>
          <p className="text-sm text-gray-500">
            Bạn có chắc chắn muốn {actionText.toLowerCase()} ga{" "}
            <span className="font-semibold text-gray-900">{station.name}</span>{" "}
            ({station.code}) không? 
            {isDeactivating && " Ga sẽ không thể được sử dụng trong các tuyến đường cho đến khi kích hoạt lại."}
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center justify-center min-w-[100px] ${
              isDeactivating ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            } disabled:opacity-50`}
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              `Xác nhận`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
