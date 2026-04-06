import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar, Cell
} from 'recharts';

const revenueData = [
  { date: '01 Th10', actual: 40, forecast: 55 },
  { date: '08 Th10', actual: 60, forecast: 65 },
  { date: '15 Th10', actual: 55, forecast: 70 },
  { date: '22 Th10', actual: 80, forecast: 90 },
  { date: '31 Th10', actual: 70, forecast: 85 },
];

const stationData = [
  { name: 'B.Thành', value: 4000 },
  { name: 'N.Hát', value: 3000 },
  { name: 'Ba Son', value: 2000 },
  { name: 'T.Cảng', value: 2780 },
  { name: 'S.Tiên', value: 1890 },
];

const histogramData = [
  { time: '00:00', val: 10 }, { time: '', val: 12 }, { time: '', val: 8 }, { time: '', val: 5 }, { time: '', val: 40 },
  { time: '04:00', val: 70 }, { time: '', val: 180 }, { time: '', val: 240 }, { time: '', val: 210 }, { time: '', val: 100 },
  { time: '08:00', val: 60 }, { time: '', val: 50 }, { time: '', val: 40 }, { time: '', val: 45 }, { time: '', val: 50 },
  { time: '12:00', val: 55 }, { time: '', val: 60 }, { time: '', val: 150 }, { time: '', val: 190 }, { time: '', val: 210 },
  { time: '16:00', val: 230 }, { time: '', val: 160 }, { time: '', val: 70 }, { time: '', val: 40 }, { time: '', val: 20 },
  { time: '20:00', val: 15 }, { time: '', val: 10 }, { time: '', val: 5 }
];

export default function ReportDashboardCharts() {
  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Top Row: Line Chart + Station Bar Chart */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Doanh thu theo thời gian */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-[2] relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Doanh thu theo thời gian</h3>
              <p className="text-xs text-blue-600/80 font-medium">Dữ liệu tổng hợp từ các kênh thanh toán</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
               <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>Thực tế</span>
               <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>Dự báo</span>
            </div>
          </div>
          
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(val) => `${val}M`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="forecast" stroke="#D1D5DB" strokeWidth={3} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột phải: Lưu lượng theo ga */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex-1">
           <div className="mb-8">
             <h3 className="text-lg font-bold text-gray-900">Lưu lượng hành khách theo ga</h3>
           </div>
           
           <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {stationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#93C5FD'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>

      </div>

      {/* Bottom Row: Histogram */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Histogram lưu lượng theo giờ</h3>
            <p className="text-xs text-blue-600/80 font-medium">Phân tích mật độ di chuyển trong 24 giờ qua</p>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Cao điểm dự kiến: 07:30 - 08:45
          </div>
        </div>
        
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="10%">
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} interval={5} />
              <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                {histogramData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.val > 150 ? (entry.val > 220 ? '#2563EB' : '#3B82F6') : entry.val > 80 ? '#93C5FD' : '#E5E7EB'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
