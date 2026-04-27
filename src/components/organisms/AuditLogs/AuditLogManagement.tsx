import { useState, useEffect, useCallback } from "react";
import { auditLogApi } from "@features/auditLog/auditLogApi";
import { AuditLog, AuditLogFilterParams } from "@features/auditLog/auditLogTypes";
import AuditLogFilter from "./AuditLogFilter";
import AuditLogTable from "./AuditLogTable";
import AuditLogPagination from "./AuditLogPagination";

export default function AuditLogManagement() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // States
  const [page, setPage] = useState(1);
  const limit = 4; // Khớp với mockup 4 rows/page
  const [filters, setFilters] = useState<AuditLogFilterParams>({
    dateRange: "today",
    actor: "all",
    action: "all",
  });
  
  // State for active filters actually applied (to avoid trigger on just select change)
  const [activeFilters, setActiveFilters] = useState<AuditLogFilterParams>(filters);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await auditLogApi.getLogs(activeFilters, page, limit);
      setLogs(result.data);
      setTotalRecords(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyFilter = () => {
    setPage(1); // Reset to page 1 on new filter
    setActiveFilters(filters);
  };

  return (
    <div className="flex flex-col gap-6 relative min-h-[calc(100vh-6rem)]">
      
      {/* Title */}
      <div className="flex flex-col items-start gap-1">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          Nhật ký hoạt động
        </h1>
      </div>

      {/* Filter Section */}
      <div className="w-full">
         <AuditLogFilter 
           filters={filters} 
           setFilters={setFilters} 
           onFilter={handleApplyFilter} 
         />
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="flex-1 relative min-h-[400px]">
           {loading ? (
             <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
           ) : null}
           <AuditLogTable logs={logs} />
        </div>
        
        {/* Pagination Sticks to Bottom */}
        <AuditLogPagination 
          page={page} 
          limit={limit} 
          total={totalRecords} 
          hasMore={page * limit < totalRecords} 
          setPage={setPage} 
        />
      </div>

    </div>
  );
}
