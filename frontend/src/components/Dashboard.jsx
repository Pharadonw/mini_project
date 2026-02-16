// Dashboard.jsx
import { useEffect, useMemo, useState } from "react";

// --- Constants & Helpers ---
const TRIAGE = {
  "1": { label: "Resuscitation", bg: "#ef4444", text: "#ffffff" },
  "2": { label: "Emergency",     bg: "#f472b6", text: "#ffffff" },
  "3": { label: "Urgency",       bg: "#fde047", text: "#000000" },
  "4": { label: "Semi-Urgency",  bg: "#86efac", text: "#000000" },
  "5": { label: "Non-Urgency",   bg: "#e5e7eb", text: "#000000" },
};

const TRIAGE_ORDER = ["1", "2", "3", "4", "5"];

const TRIAGE_NAME_TO_KEY = {
  "resuscitation": "1", "emergency": "2", "urgency": "3", "semi-urgency": "4", "non-urgency": "5",
};

const PT_TYPE = {
  "1": "Emergency", "2": "Accident", "3": "General", "4": "Other", "5": "Traffic Accident",
};

function TriageBadge({ value }) {
  let key = String(value ?? "").trim();
  if (!TRIAGE[key]) {
    const k2 = TRIAGE_NAME_TO_KEY[key.toLowerCase()];
    if (k2) key = k2;
  }
  const info = TRIAGE[key] ?? TRIAGE["5"];
  return (
    <span className="px-2 py-1 rounded text-sm font-medium border border-gray-300 shadow-sm" 
          style={{ backgroundColor: info.bg, color: info.text }}>
      {info.label}
    </span>
  );
}

function PtTypeBadge({ value }) {
  const label = PT_TYPE[String(value ?? "").trim()] || String(value ?? "");
  return <span className="badge badge-ghost text-xs md:text-sm bg-gray-100">{label}</span>;
}

function formatThaiDateFull(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  return `${d.getDate()} / ${months[d.getMonth()]} / ${d.getFullYear() + 543}`;
}

function formatThaiDateShort(dateStr) {
  if (!dateStr) return "-";
  const datePart = String(dateStr).split(" ")[0]; 
  const [year, month, day] = datePart.split("-");
  
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${parseInt(year) + 543}`;
}

// --- Icons Components (Image Files) ---
const Icons = {
  Total: () => <img src="/icons/icon-total.png" alt="Total" className="w-14 h-14 object-contain opacity-90" />,
  Admit: () => <img src="/icons/icon-admit.png" alt="Admit" className="w-14 h-14 object-contain opacity-90" />,
  AdmitHW: () => <img src="/icons/icon-admit.png" alt="AdmitHW" className="w-14 h-14 object-contain opacity-90" />,
  Refer: () => <img src="/icons/icon-refer.png" alt="Refer" className="w-14 h-14 object-contain opacity-90" />,
  EMS: () => <img src="/icons/icon-ems.png" alt="EMS" className="w-14 h-14 object-contain opacity-90" />,
  DC: () => <img src="/icons/icon-dc.png" alt="DC" className="w-14 h-14 object-contain opacity-90" />
};

export default function Dashboard() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [live, setLive] = useState([]);

  // 🔥 1. เพิ่ม State สำหรับควบคุมการย่อ/ขยาย (false = ย่อเหลือ 3 แถว)
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [s1, s3] = await Promise.all([
          fetch(`/api/dashboard/summary?date=${date}`).then((r) => r.json()),
          fetch(`/api/dashboard/live?date=${date}`).then((r) => r.json()),
        ]);
        if (!alive) return;
        setRows(s1.rows || []);
        setLive(s3.rows || []);
      } catch (err) {
        console.error("Load failed", err);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [date]);

  const matrixData = useMemo(() => {
    const mapData = new Map();
    TRIAGE_ORDER.forEach(k => mapData.set(k, { count: 0, admit: 0, admitHW: 0, refer: 0, ems: 0, dc: 0 }));

    (rows || []).forEach((r) => {
      const raw = String(r.triage ?? "").trim();
      const key = TRIAGE[raw] ? raw : (TRIAGE_NAME_TO_KEY[raw.toLowerCase()] || raw);
      const useKey = TRIAGE_ORDER.includes(String(key)) ? String(key) : "5";
      const current = mapData.get(useKey);
      
      mapData.set(useKey, {
        count:    current.count    + (Number(r.count) || 0),
        admit:    current.admit    + (Number(r.admit) || 0),
        admitHW:  current.admitHW  + (Number(r.admitHW) || 0),
        refer:    current.refer    + (Number(r.refer) || 0),
        ems:      current.ems      + (Number(r.ems) || 0),
        dc:       current.dc       + (Number(r.dc) || 0),
      });
    });

    return TRIAGE_ORDER.map(k => ({ key: k, ...TRIAGE[k], ...mapData.get(k) }));
  }, [rows]);

  const footerTotals = useMemo(() => {
    return matrixData.reduce((acc, row) => ({
      count:   acc.count + row.count,
      admit:   acc.admit + row.admit,
      admitHW: acc.admitHW + row.admitHW,
      refer:   acc.refer + row.refer,
      ems:     acc.ems + row.ems,
      dc:      acc.dc + row.dc,
    }), { count: 0, admit: 0, admitHW: 0, refer: 0, ems: 0, dc: 0 });
  }, [matrixData]);

  const renderCard = (title, count, IconComponent, borderColor) => (
    <div className={`bg-white rounded-xl p-4 flex flex-col items-center justify-center shadow-md border-b-4 ${borderColor} h-36 w-full transition-transform hover:scale-105 duration-200`}>
      <div className="mb-2">
        <IconComponent />
      </div>
      <h3 className="text-gray-500 font-bold text-sm md:text-base uppercase tracking-wide">{title}</h3>
      <div className="flex items-baseline gap-1 mt-1">
        <p className="text-gray-800 font-extrabold text-3xl md:text-4xl">{count}</p>
        <span className="text-gray-400 text-xs font-normal">ราย</span>
      </div>
    </div>
  );

  // 🔥 2. คำนวณรายการที่จะแสดง (ถ้า isExpanded=true เอาหมด, ถ้า false เอาแค่ 3 อันแรก)
  const displayedLiveRows = isExpanded ? live : live.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 p-4 bg-gray-50 min-h-screen">
      
      {/* --- Section 1: Top Cards --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {renderCard("รวม", footerTotals.count, Icons.Total, "border-gray-500")}
        {renderCard("ADMIT", footerTotals.admit, Icons.Admit, "border-blue-500")}
        {renderCard("ADMIT HW", footerTotals.admitHW, Icons.AdmitHW, "border-indigo-500")} 
        {renderCard("REFER", footerTotals.refer, Icons.Refer, "border-orange-500")}
        {renderCard("EMS", footerTotals.ems, Icons.EMS, "border-rose-500")}
        {renderCard("D/C", footerTotals.dc, Icons.DC, "border-emerald-500")}
      </div>

      {/* --- Date Header --- */}
      <div className="bg-white py-3 px-6 rounded-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-indigo-600">
        <span className="text-lg md:text-xl font-bold text-gray-800 whitespace-nowrap">
          📅 ตารางการปฏิบัติงาน ER ประจำวันที่ &nbsp; <span className="text-indigo-600">{formatThaiDateFull(date)}</span>
        </span>
        <div className="flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200 shrink-0">
           <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">เลือกวันที่ :</span>
           <input 
             type="date" 
             className="bg-transparent text-gray-800 p-1 text-sm cursor-pointer focus:outline-none font-medium"
             value={date} 
             onChange={(e) => setDate(e.target.value)} 
           />
        </div>
      </div>

      {/* --- Main Matrix Table --- */}
      <div className="overflow-hidden shadow-lg rounded-xl border border-gray-200 bg-white">
        <table className="table w-full text-center">
          <thead>
            <tr className="bg-indigo-600 text-white text-base tracking-wide">
              <th className="w-1/6 py-4 font-semibold">ประเภท</th>
              <th className="w-1/6 border-l border-indigo-400 font-semibold">จำนวนผู้ป่วย</th>
              <th className="border-l border-indigo-400 font-semibold">Admit</th>
              <th className="border-l border-indigo-400 font-semibold">AdmitHW</th>
              <th className="border-l border-indigo-400 font-semibold">Refer</th>
              <th className="border-l border-indigo-400 font-semibold">EMS</th>
              <th className="border-l border-indigo-400 font-semibold">D/C</th>
            </tr>
          </thead>
          <tbody>
            {matrixData.map((row) => (
              <tr key={row.key} style={{ backgroundColor: row.bg, color: row.text }}>
                <td className="font-bold text-left pl-6 py-4 text-lg">{row.label}</td>
                <td className="font-bold border-l border-black/5 text-xl">{row.count}</td>
                <td className="border-l border-black/5 text-lg font-medium opacity-80">{row.admit}</td>
                <td className="border-l border-black/5 text-lg font-medium opacity-80">{row.admitHW}</td>
                <td className="border-l border-black/5 text-lg font-medium opacity-80">{row.refer}</td>
                <td className="border-l border-black/5 text-lg font-medium opacity-80">{row.ems}</td>
                <td className="border-l border-black/5 text-lg font-medium opacity-80">{row.dc}</td>
              </tr>
            ))}
            <tr className="bg-blue-100 text-blue-900 font-bold text-lg border-t-2 border-blue-200">
              <td className="py-4 pl-6 text-left">TOTAL (รวมทั้งหมด)</td>
              <td className="border-l border-blue-200 text-xl">{footerTotals.count}</td>
              <td className="border-l border-blue-200">{footerTotals.admit}</td>
              <td className="border-l border-blue-200">{footerTotals.admitHW}</td>
              <td className="border-l border-blue-200">{footerTotals.refer}</td>
              <td className="border-l border-blue-200">{footerTotals.ems}</td>
              <td className="border-l border-blue-200">{footerTotals.dc}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- Last 10 Update --- */}
      <div className="mt-2 pb-10"> {/* เพิ่ม padding-bottom กันตกขอบ */}
        <div className="flex justify-between items-end mb-3">
             <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-6 bg-red-500 rounded-sm inline-block"></span>
                อัปเดทล่าสุด
             </h2>
             <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                เวลาอัปเดทล่าสุด: {new Date().toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'})} น.
             </span>
        </div>
        
        <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200 flex flex-col">
          <table className="table w-full mb-0">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="font-semibold py-3 pl-4 text-left">รหัสการเข้ารับบริการ (VN)</th>
                <th className="font-semibold text-center">ระดับความรุนแรง</th>
                <th className="font-semibold text-center">ประเภทผู้ป่วย</th>
                <th className="font-semibold text-right pr-4">วันที่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* 🔥 3. ใช้ displayedLiveRows แทน live */}
              {displayedLiveRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-indigo-50 transition-colors duration-150">
                  <td className="font-mono text-indigo-600 font-medium text-sm pl-4 py-3">{r.vn}</td>
                  <td className="text-center"><TriageBadge value={r.triage} /></td>
                  <td className="text-center"><PtTypeBadge value={r.pt_type} /></td>
                  <td className="text-right text-xs text-gray-500 pr-4">{formatThaiDateShort(r.date_only)}</td>
                </tr>
              ))}
              {live.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400 italic bg-gray-50">— ยังไม่มีข้อมูลอัปเดต —</td></tr>
              )}
            </tbody>
          </table>

          {/* 🔥 4. ส่วนปุ่ม Dropdown/Toggle แสดงเมื่อข้อมูลมีมากกว่า 3 แถว */}
          {live.length > 3 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors border-t border-gray-100 flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
            >
              {isExpanded ? (
                <>
                   ย่อรายการ 
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </>
              ) : (
                <>
                   ดูทั้งหมด {live.length} รายการ 
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </>
              )}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}