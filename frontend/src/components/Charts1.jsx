import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, ComposedChart
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

// Custom Tooltip สำหรับ Hourly Chart
const CustomHourlyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-100 border border-base-300 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm">เวลา {payload[0].payload.time}</p>
        <p className="text-primary text-lg font-bold">{payload[0].value} คน</p>
      </div>
    );
  }
  return null;
};

// --- Constants & Colors ---
const TRIAGE = {
  "1": { label: "Resuscitation", labelTH: "วิกฤต", bg: "#ef4444" }, 
  "2": { label: "Emergency", labelTH: "ฉุกเฉิน", bg: "#ff7c7c" },   
  "3": { label: "Urgency", labelTH: "เร่งด่วน", bg: "#fbbf24" },    
  "4": { label: "Semi-Urgency", labelTH: "ไม่รุนแรง", bg: "#34d399" }, 
  "5": { label: "Non-Urgency", labelTH: "ทั่วไป", bg: "#36a2eb" },  
};
const TRIAGE_ORDER = ["1", "2", "3", "4", "5"];

// สีสำหรับเพศและอายุ
const GENDER_COLORS = { Male: "#3b82f6", Female: "#ec4899" };
const AGE_COLORS = { Child: "#4ade80", Adult: "#fbbf24", Elderly: "#60a5fa" };

const Charts1 = ({ date: propDate }) => {
  const queryDate = propDate || new Date().toISOString().slice(0, 10);
  
  const [pieData, setPieData] = useState([]);
  const [severityCounts, setSeverityCounts] = useState({}); 
  const [genderData, setGenderData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true; // 🔥 ป้องกันการ update state หลัง component unmount
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // ✅ แก้ไขตรงนี้: เพิ่ม &type=daily เพื่อบอก Backend ว่าขอกราฟรายวัน
        const response = await fetch(`/api/dashboard/charts?date=${queryDate}&type=daily`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();

        if (!alive) return; // 🔥 หยุดถ้า component ถูก unmount แล้ว

        // 1. Triage Pie
        const severityData = result.severity || {}; 
        setSeverityCounts(severityData); 
        const mappedPieData = TRIAGE_ORDER.map(key => ({
            name: TRIAGE[key].label,
            value: severityData[key] || 0,
            fill: TRIAGE[key].bg 
        }));
        setPieData(mappedPieData);

        // 2. Gender Pie
        const maleCount = result.gender?.male || 0;
        const femaleCount = result.gender?.female || 0;
        const totalGender = maleCount + femaleCount;
        setGenderData([
           { name: 'ชาย', value: maleCount, fill: GENDER_COLORS.Male, percentage: totalGender > 0 ? ((maleCount / totalGender) * 100).toFixed(0) : 0 },
           { name: 'หญิง', value: femaleCount, fill: GENDER_COLORS.Female, percentage: totalGender > 0 ? ((femaleCount / totalGender) * 100).toFixed(0) : 0 },
        ]);

        // 3. Age Pie
        const childCount = result.age?.child || 0;
        const adultCount = result.age?.adult || 0;
        const elderlyCount = result.age?.elderly || 0;
        const totalAge = childCount + adultCount + elderlyCount;
        setAgeData([
           { name: 'เด็ก', detail: '< 15 ปี', value: childCount, fill: AGE_COLORS.Child, percentage: totalAge > 0 ? ((childCount / totalAge) * 100).toFixed(0) : 0 },
           { name: 'ผู้ใหญ่', detail: '15-60 ปี', value: adultCount, fill: AGE_COLORS.Adult, percentage: totalAge > 0 ? ((adultCount / totalAge) * 100).toFixed(0) : 0 },
           { name: 'ผู้สูงอายุ', detail: '60 ปีขึ้นไป', value: elderlyCount, fill: AGE_COLORS.Elderly, percentage: totalAge > 0 ? ((elderlyCount / totalAge) * 100).toFixed(0) : 0 },
        ]);

        // 4. Hourly Trend
        const currentHour = new Date().getHours();
        const isToday = queryDate === new Date().toISOString().slice(0, 10);
        // เช็คว่า result.hourly มีข้อมูลหรือไม่ก่อน slice
        const rawHourly = result.hourly || [];
        const finalHourly = isToday ? rawHourly.slice(0, currentHour + 1) : rawHourly;
        setHourlyData(finalHourly);

      } catch (error) {
        console.error("Failed to fetch chart data", error);
      } finally {
        setLoading(false);
      }
    };

    // 🔥 โหลดข้อมูลครั้งแรกทันที
    fetchData();
    
    // 🔥 ตั้ง interval ให้อัปเดทข้อมูลทุก 60 วินาที (เหมือน Dashboard)
    const intervalId = setInterval(fetchData, 60000);
    
    // 🔥 Cleanup: ยกเลิก interval เมื่อ component ถูก unmount หรือ queryDate เปลี่ยน
    return () => {
      alive = false;
      clearInterval(intervalId);
    };
  }, [queryDate]);

  return (
    <div className="w-full mt-4 flex flex-col gap-6" id="charts-section">
      {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
             <span className="loading loading-spinner loading-lg mr-2"></span> กำลังโหลดข้อมูล...
          </div>
      ) : (
        <>
           {/* --- ROW 1: Pie Charts --- */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. Triage (Donut Style) */}
              <div className="card bg-base-100 shadow-xl border border-base-200">
                 <div className="card-body p-4 items-center">
                    <h3 className="card-title text-sm font-bold self-start flex gap-2">
                       🚑 ความรุนแรง
                    </h3>
                    <div className="h-48 w-full flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie 
                               data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={45} 
                               paddingAngle={2} dataKey="value" labelLine={false} label={false} stroke="none"
                             >
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                             </Pie>
                             <Tooltip content={<CustomPieTooltip />} />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 mt-[-10px]">
                        {TRIAGE_ORDER.map((key) => {
                            const info = TRIAGE[key];
                            const count = severityCounts[key] || 0;
                            return (
                                <div key={key} className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: info.bg }}></div>
                                    <span className="font-medium text-sm" style={{ color: info.bg }}>
                                        {info.label} ({count})
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                 </div>
              </div>

              {/* 2. Gender (Donut Style) */}
              <div className="card bg-base-100 shadow-xl border border-base-200">
                 <div className="card-body p-4 items-center">
                    <h3 className="card-title text-sm font-bold self-start">👫 เพศ</h3>
                    <div className="h-48 w-full flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie 
                               data={genderData} cx="50%" cy="50%" outerRadius={70} innerRadius={45}
                               paddingAngle={2} dataKey="value" labelLine={false} label={false} stroke="none"
                             >
                                {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                             </Pie>
                             <Tooltip content={<CustomPieTooltip />} />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                    {/* Legend Custom for Gender */}
                    <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 mt-[-10px]">
                        {genderData.map((entry, index) => (
                             <div key={index} className="flex items-center gap-1.5">
                                 <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.fill }}></div>
                                 <span className="font-medium text-sm" style={{ color: entry.fill }}>
                                     {entry.name} ({entry.value})
                                 </span>
                             </div>
                        ))}
                    </div>
                 </div>
              </div>

              {/* 3. Age (Donut Style) */}
              <div className="card bg-base-100 shadow-xl border border-base-200">
                 <div className="card-body p-4 items-center">
                    <h3 className="card-title text-sm font-bold self-start">🎂 ช่วงอายุ</h3>
                    <div className="h-48 w-full flex items-center justify-center">
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie 
                               data={ageData} cx="50%" cy="50%" outerRadius={70} innerRadius={45}
                               paddingAngle={2} dataKey="value" labelLine={false} label={false} stroke="none"
                             >
                                {ageData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                             </Pie>
                             <Tooltip content={<CustomPieTooltip />} />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                    {/* Legend Custom for Age */}
                    <div className="w-full flex flex-wrap justify-center gap-x-4 gap-y-2 mt-[-10px]">
                        {ageData.map((entry, index) => (
                             <div key={index} className="flex items-center gap-1.5">
                                 <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.fill }}></div>
                                 <span className="font-medium text-sm" style={{ color: entry.fill }}>
                                     {entry.name} ({entry.value})
                                 </span>
                             </div>
                        ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* --- ROW 2: Hourly Today --- */}
           <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body p-4">
                 <h3 className="card-title text-lg font-bold mb-2">📊 ปริมาณผู้ป่วยรายชั่วโมง</h3>
                 <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                             <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomHourlyTooltip />} />
                          <Area type="monotone" dataKey="patients" stroke="none" fill="url(#colorDaily)" />
                          <Line type="monotone" dataKey="patients" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </>
      )}
    </div>
  );
};

export default Charts1;