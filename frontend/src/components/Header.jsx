import React from "react";
import Logo from "../assets/img/Logo1.png";

export default function Header() {
  return (
    <div className="w-full bg-base-100 border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">

        {/* กล่องด้านใน (กรอบตามภาพวาด) */}
        <div className="border rounded-md px-4 py-2 flex items-center gap-3">

          {/* โลโก */}
          <img 
            src={Logo} 
            alt="Logo" 
            className="w-16 h-16 object-contain"
          />

          {/* ชื่อโรงพยาบาล */}
          <h1 className="text-xl font-bold tracking-wide">
            โรงพยาบาล ศรีนคร
          </h1>
        </div>

      </div>
    </div>
  );
}
