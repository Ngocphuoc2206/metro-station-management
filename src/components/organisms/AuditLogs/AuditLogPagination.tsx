interface Props {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean; // Just a mock helper
  setPage: (p: number) => void;
}

export default function AuditLogPagination({ page, limit, total, setPage }: Props) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);

  // Helper cho danh sách pages để render giống "1, 2, 3"
  const getPages = () => {
    let pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) pages = [1, 2, 3, 4, 5];
      else if (page >= totalPages - 2) pages = [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      else pages = [page - 2, page - 1, page, page + 1, page + 2];
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-5 bg-white border-t border-gray-100 rounded-b-2xl">
      <div className="text-xs font-semibold text-gray-500 mb-4 sm:mb-0">
        Hiển thị {start} - {end} của {total.toLocaleString()} nhật ký
      </div>
      
      <div className="flex items-center gap-1.5">
        <button 
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {getPages().map(p => (
           <button 
            key={p}
            onClick={() => setPage(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs transition-colors ${
              page === p ? "bg-blue-600 text-white border-transparent" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        <button 
          disabled={page === totalPages || total === 0}
          onClick={() => setPage(page + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
