// src/components/Patient.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Patient.jsx — ใช้แทน Emergency ได้ทันที
 * - ดึงข้อมูลจาก /api/patient (เปลี่ยนได้ด้วย prop endpoint)
 * - loading / error / empty
 * - ค้นหา client-side
 * - ปุ่มรีเฟรช
 * - ยกเลิก fetch เมื่อ unmount
 * - แสดงคอลัมน์ที่มักมีใน Emer ถ้ามีอยู่จริงในข้อมูล
 */
export default function Patient({
  title = "รายชื่อผู้ป่วย",
  endpoint = "/api/patient",
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const abortRef = useRef(null);

  const fetchRows = async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("API must return an array");
      setRows(data);
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
    fetchRows();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  // กำหนดคีย์หลักที่ Emer ชอบใช้ ถ้ามีจะถูกแสดงเป็นคอลัมน์
  const preferredKeys = [
    "hn",
    "fname",
    "lname",
  ];

  // เลือกคอลัมน์จากข้อมูลจริง: เอาเฉพาะคีย์ที่มีอยู่ในแถวแรก
  const columns = useMemo(() => {
    const sample = rows[0] || {};
    // ถ้าไม่มีคีย์ preferred ใดเลย ให้ fallback เป็นทุกคีย์ของ sample
    const preferred = preferredKeys.filter((k) => k in sample);
    return preferred.length ? preferred : Object.keys(sample);
  }, [rows]);

  // ฟังก์ชันอ่านชื่อเต็ม (ใช้กับค้นหา)
  const fullNameOf = (r) =>
    `${r.fname ?? ""} ${r.lname ?? ""}`.trim().toLowerCase();

  // ค้นหาแบบง่าย: ดูในชื่อ-นามสกุล + HN + department/ward/room
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = [
        r.hn,
        r.fname,
        r.lname,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q) || fullNameOf(r).includes(q);
    });
  }, [rows, query]);

  return (
    <div className="p-6 space-y-4">
      {/* Header / Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ค้นหา: ชื่อ/สกุล/HN/แผนก…"
            className="input input-bordered w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="btn btn-outline"
            onClick={fetchRows}
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
          <button className="btn btn-sm ml-auto" onClick={fetchRows}>
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="alert">
          <span>
            {rows.length === 0
              ? "ไม่มีข้อมูลจากเซิร์ฟเวอร์"
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
                {columns.map((col) => (
                  <th key={col}>{col.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id ?? `${r.hn ?? ""}-${r.fname ?? ""}-${i}`}>
                  <td>{i + 1}</td>
                  {columns.map((col) => (
                    <td key={col}>
                      {formatCell(r[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-sm opacity-70 mt-2">
            แสดง {filtered.length} รายการ
            {query ? ` (จากทั้งหมด ${rows.length})` : ""}
          </div>
        </div>
      )}
    </div>
  );
}

// แปลงค่าบางประเภทให้อ่านง่ายขึ้น
function formatCell(val) {
  if (val == null) return "-";
  if (typeof val === "boolean") return val ? "✓" : "—";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  // object / date string แบบ ISO
  try {
    // ถ้าเป็นวันที่ ISO ให้ตัดให้สั้น
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
      return val.replace("T", " ").replace("Z", "");
    }
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}
