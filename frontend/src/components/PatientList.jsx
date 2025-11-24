import { useEffect, useMemo, useRef, useState } from "react";

/**
 * PatientList.jsx — เวอร์ชันสมบูรณ์อันเดียว
 * - ดึงข้อมูล /api/patient
 * - มี loading / error / empty
 * - ค้นหาแบบ client-side
 * - ปุ่มรีเฟรช
 * - ยกเลิก fetch เมื่อ unmount (กัน memory leak)
 * - UI ใช้ DaisyUI + Tailwind v4
 */
export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [query, setQuery]       = useState("");
  const abortRef = useRef(null);

  const fetchPatients = async () => {
    // ยกเลิกคำขอเดิม (ถ้ามี)
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/patient", { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // ป้องกันกรณี API ส่งไม่ใช่ array
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Fetch error:", err);
        setError("ดึงข้อมูลไม่สำเร็จ");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ค้นหาแบบง่าย: fname/lname รวมกันแล้วตรวจ includes
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const full = `${p.fname ?? ""} ${p.lname ?? ""}`.toLowerCase();
      return full.includes(q);
    });
  }, [patients, query]);

  return (
    <div className="p-6 space-y-4">
      {/* Header / Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">รายชื่อคนไข้</h2>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ค้นหาชื่อ-นามสกุล…"
            className="input input-bordered w-60"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="btn btn-outline"
            onClick={fetchPatients}
            disabled={loading}
            title="รีเฟรชข้อมูล"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button className="btn btn-sm ml-auto" onClick={fetchPatients}>
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="alert">
          <span>
            {patients.length === 0
              ? "ไม่มีข้อมูลคนไข้จากเซิร์ฟเวอร์"
              : "ไม่พบผลลัพธ์ตามคำค้น"}
          </span>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base">
                <th>#</th>
                <th>ชื่อ</th>
                <th>นามสกุล</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id ?? `${p.fname}-${p.lname}-${i}`}>
                  <td>{i + 1}</td>
                  <td>{p.fname}</td>
                  <td>{p.lname}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-sm opacity-70 mt-2">
            แสดง {filtered.length} รายการ
            {query ? ` (จากทั้งหมด ${patients.length})` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
