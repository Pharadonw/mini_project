import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// Custom Tooltip สำหรับ Pie Charts
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm">{data.name}</p>
        <p className="text-primary text-lg font-bold">{data.value} คน</p>
        {data.payload.percentage && (
          <p className="text-xs text-base-content/60">({data.payload.percentage}%)</p>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip สำหรับ Area Chart (Weekly Pattern)
const CustomAreaTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm">เวลา {payload[0].payload.time}</p>
        <p className="text-warning text-lg font-bold">{payload[0].value} คน</p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip สำหรับ Bar Chart (Weekly Total)
const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm">{`${payload[0].payload.dayName} ${payload[0].payload.date}`}</p>
        <p className="text-primary text-lg font-bold">{payload[0].value} คน</p>
      </div>
    );
  }
  return null;
};

// --- Constants & Colors (Pastel Theme) ---
const TRIAGE_MAP = {
  '1': { name: 'Resuscitation', color: '#ef4444' }, // แดงเข้ม
  '2': { name: 'Emergency', color: '#ff7c7c' },     // แดงอมชมพู
  '3': { name: 'Urgency', color: '#fbbf24' },       // เหลือง
  '4': { name: 'Semi-Urgency', color: '#34d399' },  // เขียวมินต์
  '5': { name: 'Non-Urgency', color: '#36a2eb' },   // ฟ้าสดใส
  'Unknown': { name: 'Unknown', color: '#d1d5db' }
};
const TRIAGE_ORDER = ["1", "2", "3", "4", "5"];

const GENDER_COLORS = { Male: "#3b82f6", Female: "#ec4899" }; // ฟ้า, ชมพู
const AGE_COLORS = { Child: "#4ade80", Adult: "#fbbf24", Elderly: "#60a5fa" }; // เขียว, เหลือง, ฟ้า

const DAY_COLORS = {
  0: '#ef4444', 1: '#fbbf24', 2: '#ec4899', 3: '#10b981', 
  4: '#f97316', 5: '#3b82f6', 6: '#a855f7'
};
const DAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const Charts2 = ({ date: propDate }) => {
  
  // ใช้ "วันปัจจุบัน" เป็นค่าเริ่มต้น 
  // (Backend จะนำวันนี้ไปคำนวณย้อนหลัง 7 วันให้อัตโนมัติ)
  const queryDate = propDate || new Date().toISOString().slice(0, 10);
  
  // State
  const [data, setData] = useState({
    weeklyPattern: [], 
    weeklyTotal: [],
    triage: [], 
    gender: [], 
    age: []
  });
  
  // เก็บยอดดิบสำหรับแสดงใน Legend (Name (Count))
  const [counts, setCounts] = useState({ triage: {}, gender: {}, age: {} }); 
  const [loading, setLoading] = useState(false);
  const [peakWeek, setPeakWeek] = useState({ time: '-', patients: 0 });

  // Helpers
  const getDayName = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return DAY_NAMES[date.getDay()];
  };

  const getDayColor = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return DAY_COLORS[date.getDay()];
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/charts?date=${queryDate}`);
        const result = await response.json();

        // 1. Weekly Pattern (Area Chart)
        const weeklyPatternData = result.weeklyPattern || [];
        if (weeklyPatternData.length > 0) {
          const max = weeklyPatternData.reduce((prev, curr) => (prev.patients > curr.patients) ? prev : curr);
          setPeakWeek(max);
        }

        // ==========================================
        // 2. Weekly Total (Bar Chart) - อัปเดตใหม่
        // ==========================================
        const backendData = result.weeklyTotal || [];
        
        // หั่น String วันที่ เพื่อป้องกันปัญหา Timezone
        const [qYear, qMonth, qDay] = queryDate.split('-').map(Number);
        const referenceDate = new Date(qYear, qMonth - 1, qDay); 
        
        const last7Days = [];
        // วนลูปสร้างวันที่ย้อนหลัง เริ่มจาก 7 วันที่แล้ว (i=7) จนถึงเมื่อวาน (i=1)
        for (let i = 7; i >= 1; i--) {
          const d = new Date(referenceDate);
          d.setDate(d.getDate() - i);
          
          // จัดฟอร์แมตกลับเป็น YYYY-MM-DD
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          last7Days.push(`${yyyy}-${mm}-${dd}`);
        }

        // นำโครงวันที่ 7 วัน มาจับคู่กับข้อมูลจาก Backend
        const historyData = last7Days.map(dateStr => {
          const foundData = backendData.find(item => {
            if (!item.date_val) return false;
            const backendDateOnly = item.date_val.split('T')[0];
            return backendDateOnly === dateStr;
          });

          return {
            date: dateStr.split('-').slice(1).reverse().join('/'), 
            dayName: getDayName(dateStr), 
            fullDate: dateStr,
            count: foundData ? foundData.count : 0, // เติม 0 ให้วันที่ไม่มีข้อมูล
            color: getDayColor(dateStr)
          };
        });
        // ==========================================

        // 3. Triage (Donut) - ใช้ข้อมูลตรงจาก Backend ได้เลย (รวม 7 วันมาแล้ว)
        const severityObj = result.severity || {};
        const triageData = TRIAGE_ORDER.map(key => ({
            name: TRIAGE_MAP[key].name,
            value: severityObj[key] || 0,
            color: TRIAGE_MAP[key].color
        }));

        // 4. Gender (Donut)
        const genderObj = result.gender || { male: 0, female: 0 };
        const totalGender = (genderObj.male || 0) + (genderObj.female || 0);
        const genderData = [
            { name: 'ชาย', value: genderObj.male || 0, color: GENDER_COLORS.Male, percentage: totalGender > 0 ? ((genderObj.male / totalGender) * 100).toFixed(0) : 0 },
            { name: 'หญิง', value: genderObj.female || 0, color: GENDER_COLORS.Female, percentage: totalGender > 0 ? ((genderObj.female / totalGender) * 100).toFixed(0) : 0 }
        ];

        // 5. Age (Donut)
        const ageObj = result.age || { child: 0, adult: 0, elderly: 0 };
        const totalAge = (ageObj.child || 0) + (ageObj.adult || 0) + (ageObj.elderly || 0);
        const ageData = [
            { name: 'เด็ก (<15)', value: ageObj.child || 0, color: AGE_COLORS.Child, percentage: totalAge > 0 ? ((ageObj.child / totalAge) * 100).toFixed(0) : 0 },
            { name: 'ผู้ใหญ่ (15-59)', value: ageObj.adult || 0, color: AGE_COLORS.Adult, percentage: totalAge > 0 ? ((ageObj.adult / totalAge) * 100).toFixed(0) : 0 },
            { name: 'สูงอายุ (60+)', value: ageObj.elderly || 0, color: AGE_COLORS.Elderly, percentage: totalAge > 0 ? ((ageObj.elderly / totalAge) * 100).toFixed(0) : 0 },
        ];

        // Set State
        setData({
          weeklyPattern: weeklyPatternData,
          weeklyTotal: historyData,
          triage: triageData,
          gender: genderData,
          age: ageData
        });
        
        // เก็บยอดดิบไว้ใช้แสดงใน Legend
        setCounts({
            triage: severityObj,
            gender: genderObj,
            age: ageObj
        });

      } catch (error) {
        console.error("Failed to fetch dashboard charts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [queryDate]);

  if (loading) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-gray-400 mt-6 card bg-base-100 shadow-xl border border-base-200">
        <span className="loading loading-spinner loading-lg mb-2"></span>
        <p>กำลังโหลดข้อมูลกราฟ 7 วันย้อนหลัง...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-6">
      
      {/* ================= ROW 1: WEEKLY PATTERN (Area Chart) ================= */}
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-4">
          <div className="flex justify-between items-center mb-2 border-b pb-2">
            <h3 className="font-bold text-gray-700">📅 แนวโน้มเวลา (สะสม 7 วัน)</h3>
            <span className="badge badge-warning text-white font-bold">Peak: {peakWeek.time}</span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyPattern} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbd23" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fbbd23" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" interval={2} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <Tooltip content={<CustomAreaTooltip />} />
                <Area type="monotone" dataKey="patients" stroke="#fbbd23" fill="url(#colorWeekly)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================= ROW 2: WEEKLY HISTORY (Bar Chart) ================= */}
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-4">
          <h3 className="font-bold text-gray-700 mb-2">📊 สถิติยอดผู้ป่วยย้อนหลัง 7 วัน</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyTotal} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" fontSize={11} tickLine={false} axisLine={false}
                  tick={({ x, y, payload }) => {
                    const item = data.weeklyTotal.find(d => d.date === payload.value);
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={12} textAnchor="middle" fill="#666" fontSize={11}>
                          {item?.dayName}
                        </text>
                        <text x={0} y={0} dy={26} textAnchor="middle" fill="#999" fontSize={9}>
                          {payload.value}
                        </text>
                      </g>
                    );
                  }}
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomBarTooltip />} cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={50}>
                  {data.weeklyTotal.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================= ROW 3: DONUT CHARTS (Triage, Gender, Age) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 3.1 Triage */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-4 items-center">
            <h3 className="text-sm font-bold text-gray-500 mb-2 self-start">🚑 ความรุนแรง (7 วัน)</h3>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data.triage} cx="50%" cy="50%" outerRadius={70} innerRadius={45} 
                    paddingAngle={2} dataKey="value" label={false} stroke="none"
                  >
                    {data.triage.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 mt-[-10px]">
                {TRIAGE_ORDER.map((key) => {
                    const info = TRIAGE_MAP[key];
                    const count = counts.triage[key] || 0;
                    return (
                        <div key={key} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: info.color }}></div>
                            <span className="font-medium text-sm" style={{ color: info.color }}>
                                {info.name} ({count})
                            </span>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>

        {/* 3.2 Gender */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-4 items-center">
            <h3 className="text-sm font-bold text-gray-500 mb-2 self-start">👫 เพศ (7 วัน)</h3>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data.gender} cx="50%" cy="50%" outerRadius={70} innerRadius={45}
                    paddingAngle={2} dataKey="value" label={false} stroke="none"
                  >
                     {data.gender.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 mt-[-10px]">
                {data.gender.map((entry, index) => (
                     <div key={index} className="flex items-center gap-1.5">
                         <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                         <span className="font-medium text-sm" style={{ color: entry.color }}>
                             {entry.name} ({entry.value})
                         </span>
                     </div>
                ))}
            </div>
          </div>
        </div>

        {/* 3.3 Age */}
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body p-4 items-center">
            <h3 className="text-sm font-bold text-gray-500 mb-2 self-start">🎂 ช่วงอายุ (7 วัน)</h3>
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data.age} cx="50%" cy="50%" outerRadius={70} innerRadius={45}
                    paddingAngle={2} dataKey="value" label={false} stroke="none"
                  >
                     {data.age.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 mt-[-10px]">
                {data.age.map((entry, index) => (
                     <div key={index} className="flex items-center gap-1.5">
                         <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }}></div>
                         <span className="font-medium text-sm" style={{ color: entry.color }}>
                             {entry.name} ({entry.value})
                         </span>
                     </div>
                ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Charts2;