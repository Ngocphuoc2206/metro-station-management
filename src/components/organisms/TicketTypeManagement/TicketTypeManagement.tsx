import { useState, useEffect, useCallback } from "react";
import { ticketTypeApi } from "@features/ticketType/ticketTypeApi";
import { TicketType } from "@features/ticketType/ticketTypeTypes";
import TicketTypeList from "./TicketTypeList";
import TicketTypeFormModal from "./TicketTypeFormModal";

export default function TicketTypeManagement() {
  const [data, setData] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<TicketType | null>(null);

  // Delete Confirm Modal states
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ticketTypeApi.getTicketTypes();
      setData(result);
    } catch (e) {
      console.error(e);
      alert("Lỗi tải danh sách loại vé");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreateOrUpdate = async (formData: any) => {
    try {
      if (editingType) {
        if (!editingType.id) {
          alert("Không tìm thấy ID loại vé để cập nhật. Vui lòng tải lại danh sách và thử lại.");
          return;
        }

        const updated = await ticketTypeApi.updateTicketType(
          editingType.id,
          formData,
        );
        setData((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
      } else {
        const created = await ticketTypeApi.createTicketType(formData);
        setData((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
      setEditingType(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu thông tin loại vé");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await ticketTypeApi.deleteTicketType(deleteId);
      setData((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xoá loại vé");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-2 tracking-tight">
            Quản lý loại vé
          </h1>
          <nav className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <span className="hover:text-gray-600 transition-colors cursor-pointer">
              Admin
            </span>
            <span>›</span>
            <span className="text-gray-900">Loại vé</span>
          </nav>
        </div>

        <button
          onClick={() => {
            setEditingType(null);
            setIsModalOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md sm:w-auto"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Thêm loại vé
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <TicketTypeList
          data={data}
          onEdit={(t) => {
            setEditingType(t);
            setIsModalOpen(true);
          }}
          onDelete={(id) => setDeleteId(id)}
        />
      )}

      {/* Form Modal */}
      <TicketTypeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingType(null);
        }}
        ticketType={editingType}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Basic Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] p-6 text-center transform transition-all">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Xác nhận xóa vé
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc chắn muốn xóa loại vé này? Thao tác này có thể ảnh
              hưởng đến các giao dịch đã mua.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
