import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WeeklyChart = () => {
  const [data, setData] = useState([
    { day: 'จันทร์', cases: 45 },
    { day: 'อังคาร', cases: 52 },
    { day: 'พุธ', cases: 38 },
    { day: 'พฤหัส', cases: 65 },
    { day: 'ศุกร์', cases: 48 },
    { day: 'เสาร์', cases: 70 },
    { day: 'อาทิตย์', cases: 60 },
  ]);

  useEffect(() => {
    // fetch(...)
  }, []);

  return (
    // ✨ ใช้ DaisyUI Card Class
    <div className="card bg-base-100 shadow-xl w-full h-full">
      <div className="card-body">
        <h2 className="card-title text-secondary">สถิติย้อนหลัง 7 วัน</h2>
        
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend />
              {/* ใช้สีจาก Theme DaisyUI ได้เลย เช่น 'oklch(var(--p))' หรือสีตายตัว */}
              <Bar dataKey="cases" name="ผู้ป่วย (คน)" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChart;