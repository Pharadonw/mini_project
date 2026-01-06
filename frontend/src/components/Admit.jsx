import { useState, useEffect } from "react";

// --- Helper: Masking Citizen ID ---
function maskCitizenID(id) {
  if (!id || id.length !== 13) return id || "-";
  return `${id[0]}-${id.slice(1, 3)}xx-xxxxx-${id.slice(10, 12)}-${id[12]}`;
}

// --- Helper: Format Date & Time ---
function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "-";
  const datePart = String(dateStr).split(" ")[0];
  const [y, m, d] = datePart.split("-");
  const thaiYear = parseInt(y) + 543;
  const shortYear = String(thaiYear).slice(2); 
  const shortTime = timeStr ? String(timeStr).substring(0, 5) : "";

  return (
    <div className="flex flex-col">
        <span className="font-bold text-lg text-gray-700">{shortTime} น.</span>
        <span className="text-xs text-gray-400 font-medium">
            {d}/{m}/{shortYear}
        </span>
    </div>
  );
}

// --- Component: Gender Icon ---
function GenderIcon({ sex }) {
  const s = String(sex).toUpperCase();
  if (s === "M" || s === "1") return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold border border-blue-200">ชาย</span>;
  if (s === "F" || s === "2") return <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-xs font-bold border border-pink-200">หญิง</span>;
  return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold">-</span>;
}

export default function Admit() {
  const [patients, setPatients] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/dashboard/admit");
      const data = await res.json();
      if (data.rows) setPatients(data.rows);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch admit data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 600000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">🛏️</span> 
             รายการผู้ป่วย Admit
           </h1>
           <div className="flex items-center gap-2 mt-1">
             <p className="text-gray-500 text-sm">
               จำนวนผู้ป่วยขณะนี้: <span className="font-bold text-indigo-600">{patients.length}</span> ราย
             </p>
             {loading && <span className="loading loading-spinner loading-xs text-indigo-500"></span>}
           </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
        <table className="table w-full text-left min-w-[1100px]"> 
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider border-b border-gray-200">
            <tr>
              <th className="py-4 pl-6 w-24">วันเวลา</th>
              <th className="py-4 w-1/5">ผู้ป่วย / เลขบัตร</th>
              <th className="py-4">สิทธิการรักษา</th>
              <th className="py-4">แพทย์ผู้ดูแล</th>
              <th className="py-4 w-48">ตึก</th> 
              <th className="py-4 w-1/4">การวินิจฉัย (Dx)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map((row, index) => (
              <tr key={row.an || index} className="hover:bg-indigo-50/40 transition-colors">
                
                {/* 1. วันเวลา */}
                <td className="pl-6 py-4 align-top">
                  {formatDateTime(row.regdate, row.regtime)}
                </td>

                {/* 2. ข้อมูลผู้ป่วย */}
                <td className="py-4 align-top">
                  <div className="flex flex-col gap-1.5 pr-2">
                    <div className="flex items-center gap-2">
                       <GenderIcon sex={row.sex} />
                       <span className="font-bold text-gray-800 text-base line-clamp-1">{row.pt_name}</span>
                    </div>
                    <div className="text-sm text-gray-500 font-mono flex gap-2 items-center flex-wrap">
                       <span className="bg-gray-100 px-1.5 rounded text-gray-600 whitespace-nowrap">HN: {row.hn}</span>
                       <span className="text-gray-300">|</span>
                       <span className="whitespace-nowrap">อายุ {row.age} ปี</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-mono mt-0.5">
                       <span className="opacity-50">🆔</span>
                       <span>{maskCitizenID(row.cid)}</span>
                    </div>
                  </div>
                </td>

                {/* 3. สิทธิ */}
                <td className="py-4 align-top">
                   <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 block w-fit max-w-[180px] break-words">
                     {row.pttype_name || "-"}
                   </span>
                </td>

                {/* 4. แพทย์ */}
                <td className="py-4 align-top">
                   <div className="flex items-center gap-1.5">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        👨‍⚕️
                     </div>
                     <span className="text-sm text-gray-700 font-medium">
                       {row.doctor_name || "-"}
                     </span>
                   </div>
                </td>

                {/* 5. ตึก (Ward Name) - แก้ไข: โชว์ชื่อตึกเน้นๆ */}
                <td className="py-4 align-top">
                   <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300 shadow-sm inline-block">
                     {/* ถ้า Database ส่งชื่อมาใช้ชื่อ ถ้าไม่มีให้ขึ้นว่าไม่ระบุ */}
                     {row.ward_name || "ไม่ระบุตึก"} 
                   </span>
                </td>

                {/* 6. โรค (Dx) */}
                <td className="py-4 align-top">
                   <span className="text-sm text-gray-600 font-medium line-clamp-3 leading-relaxed" title={row.dx}>
                     {row.dx || "-"}
                   </span>
                </td>

              </tr>
            ))}
            
            {!loading && patients.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400 bg-gray-50">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-2xl opacity-30">📭</span>
                            <span>ไม่พบรายการผู้ป่วยในขณะนี้</span>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}