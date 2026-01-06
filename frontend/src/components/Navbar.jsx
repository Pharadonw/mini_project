import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom"; // นำเข้า NavLink

// --- Icons (เหมือนเดิม) ---
const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const BedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 4v16" />
    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
    <path d="M2 17h20" />
    <path d="M6 8v9" />
  </svg>
);
const AmbulanceIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 10h4" />
    <path d="M12 8v4" />
    <path d="M19 17v-8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 9v8" />
    <path d="M19 17h2c.6 0 1-.4 1-1v-2c0-.6-.4-1-1-1h-1" />
    <path d="M2 17h-1" />
    <path d="M10 22h4" />
    <path d="M19 17h-4.25s-1.75 0-2.25 1-2.25 4-2.25 4" />
    <path d="M2 17h4.25s1.75 0 2.25 1 2.25 4 2.25 4" />
    <path d="M7 12h10" />
  </svg>
);

// --- Clock (เหมือนเดิม) ---
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const dateStr = time.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
  const timeStr = time.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-2xl font-bold text-indigo-700 tracking-widest font-mono">
        {timeStr} น.
      </span>
      <span className="text-xs text-gray-500 font-medium">{dateStr}</span>
    </div>
  );
}

export default function Navbar() {
  // กำหนดเส้นทาง (Path) ให้ตรงกับที่คุณตั้งไว้ใน Routes
  const menuItems = [
    { name: "หน้าหลัก", icon: <HomeIcon />, path: "/" }, // ลิงก์ไป /
    { name: "Admit Monitor", icon: <BedIcon />, path: "/Admitcase" }, // ลิงก์ไป /Admitcase
    // { name: "Refer Case", icon: <AmbulanceIcon />, path: "/Refercase" }, // เปิดใช้เมื่อพร้อม
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 h-16 mb-4">
      <div className="max-w-[1920px] mx-auto px-6 h-full flex justify-between items-center">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-800 leading-none">
              โรงพยาบาลศรีนคร
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                SRINAKHON HOSPITAL
              </span>
            </div>
          </div>
        </div>

        {/* MENU (ใช้ NavLink แทน button) */}
        <div className="hidden md:flex items-center bg-gray-100/80 p-1 rounded-xl absolute left-1/2 transform -translate-x-1/2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-6 py-1.5 rounded-lg text-sm font-bold transition-all duration-200
                ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" // สไตล์ตอนเลือกอยู่ (Active)
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50" // สไตล์ตอนไม่ได้เลือก
                }
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* CLOCK */}
        <div className="flex items-center">
          <LiveClock />
        </div>
      </div>
    </nav>
  );
}
