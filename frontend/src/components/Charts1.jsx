import React, { useState } from 'react';

const Charts1 = () => {
  // State สำหรับตัวเลือก (Filter)
  const [filterType, setFilterType] = useState('weekly');

  return (
    <div className="w-full p-6 bg-base-200 rounded-box mt-8 shadow-sm" id="charts-section">
      
      {/* --- Header ส่วนของกราฟ และ ปุ่มตัวเลือก (Filter) --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
           📊 สรุปสถิติการใช้งาน (Statistics)
        </h2>
        
        {/* Dropdown เลือกช่วงเวลา */}
        <select   
          className="select select-bordered select-primary w-full max-w-xs mt-4 md:mt-0"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="daily">ประจำวัน (Daily)</option>
          <option value="weekly">ประจำสัปดาห์ (Weekly)</option>
        </select>
      </div>

      {/* --- Grid Layout สำหรับวางกราฟ 2 ตัว --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card 1: Bar Chart (กราฟแท่ง) */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-sm opacity-70">
              {filterType === 'weekly' ? 'จำนวนผู้ป่วยรายสัปดาห์' : 'จำนวนผู้ป่วยรายวัน'}
            </h2>
            <div className="text-3xl font-bold mb-4">Total: 450</div> {/* ตัวเลขสมมติ */}
            
            {/* พื้นที่สำหรับวางกราฟ (Placeholder) */}
            <div className="h-64 w-full bg-base-200 rounded-lg flex items-center justify-center border-2 border-dashed border-base-300">
              <span className="text-base-content/50">
                [ Area for Bar Chart ]
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Pie/Donut Chart (กราฟวงกลม) */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-sm opacity-70">สัดส่วนความรุนแรง (Severity)</h2>
             <div className="text-3xl font-bold mb-4">Avg Level: 3</div> {/* ตัวเลขสมมติ */}

            {/* พื้นที่สำหรับวางกราฟ (Placeholder) */}
            <div className="h-64 w-full bg-base-200 rounded-lg flex items-center justify-center border-2 border-dashed border-base-300 relative">
              <span className="text-base-content/50">
                [ Area for Pie Chart ]
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Charts1;