// Dashboard.jsx
import { useEffect, useMemo, useState } from "react";

const TRIAGE = {
  "1": { label: "Resuscitation", color: "#ef4444", text: "#ffffff" },
  "2": { label: "Emergency",     color: "#f472b6", text: "#000000" },
  "3": { label: "Urgency",       color: "#eab308", text: "#000000" },
  "4": { label: "Semi-Urgency",  color: "#86efac", text: "#000000" },
  "5": { label: "Non-Urgency",   color: "#ffffff", text: "#000000", border: "#d1d5db" },
};

const TRIAGE_NAME_TO_KEY = {
  "resuscitation": "1",
  "emergency": "2",
  "urgency": "3",
  "semi-urgency": "4",
  "semi urgency": "4",
  "non-urgency": "5",
  "non urgency": "5",
};

const PT_TYPE = {
  "1": "Emergency",
  "2": "Accident",
  "3": "General",
  "4": "Other",
  "5": "Traffic Accident",
};

function TriageBadge({ value }) {
  let key = String(value ?? "").trim();
  if (!TRIAGE[key]) {
    const k2 = TRIAGE_NAME_TO_KEY[key.toLowerCase()];
    if (k2) key = k2;
  }
  const info = TRIAGE[key] ?? TRIAGE["5"];
  const style = {
    backgroundColor: info.color,
    color: info.text,
    border: info.border ? `1px solid ${info.border}` : undefined,
  };
  return <span className="px-2 py-1 rounded text-sm font-medium" style={style}>{info.label}</span>;
}

function PtTypeBadge({ value }) {
  const label = PT_TYPE[String(value ?? "").trim()] || String(value ?? "");
  return <span className="badge badge-ghost text-sm">{label}</span>;
}

export default function Dashboard() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [rows, setRows] = useState([]);
  const [tot, setTot] = useState({ total:0, inER:0, admit:0, admitHW:0, refer:0, ems:0, dc:0 });
  const [live, setLive] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [s1, s3] = await Promise.all([
          fetch(`/api/dashboard/summary?date=${date}`).then(r=>r.json()),
          fetch(`/api/dashboard/live?date=${date}`).then(r=>r.json()),
        ]);
        if (!alive) return;
        setRows(s1.rows || []);
        setTot(s1.totals || {});
        setLive(s3.rows || []);
      } catch {}
    };
    load();
    const t = setInterval(load, 10000);
    return () => { alive=false; clearInterval(t); };
  }, [date]);

  const triageTable = useMemo(() => {
    const order = ["1","2","3","4","5"];
    const mapCount = new Map();
    (rows||[]).forEach(r=>{
      const raw = String(r.triage ?? "").trim();
      const key = TRIAGE[raw] ? raw : (TRIAGE_NAME_TO_KEY[raw.toLowerCase()] || raw);
      const useKey = order.includes(String(key)) ? String(key) : "5";
      mapCount.set(useKey, (mapCount.get(useKey)||0) + Number(r.count||0));
    });
    return order.map(k=>({
      key:k,
      label:TRIAGE[k].label,
      color:TRIAGE[k].color,
      text:TRIAGE[k].text,
      border:TRIAGE[k].border,
      count:mapCount.get(k)||0,
    }));
  }, [rows]);

  const triageTotal = useMemo(
    ()=> triageTable.reduce((s, it)=> s + (Number(it.count)||0), 0),
    [triageTable]
  );

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ER Dashboard (Realtime)</h1>
        <input type="date" className="input input-bordered input-sm"
               value={date} onChange={e=>setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Stat title="Total" value={tot.total} />
        <Stat title="In ER" value={tot.inER} />
        <Stat title="Admit" value={tot.admit} />
        <Stat title="AdmitHW" value={tot.admitHW} />
        <Stat title="Refer" value={tot.refer} />
        <Stat title="EMS" value={tot.ems} />
        <Stat title="D/C" value={tot.dc} />
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">ตาราง ประเภทผู้ป่วยที่รับบริการ </h2>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th>ประเภท</th>
                  <th className="text-center">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {triageTable.map(row=>(
                  <tr key={row.key}
                      style={{
                        backgroundColor: row.color,
                        color: row.text,
                        borderTop: row.border ? `1px solid ${row.border}` : undefined,
                        borderBottom: row.border ? `1px solid ${row.border}` : undefined,
                      }}>
                    <td>{row.label}</td>
                    <td className="text-center">{row.count}</td>
                  </tr>
                ))}

                <tr className="bg-blue-300 text-black font-bold">
                  <td>Total</td>
                  <td className="text-center">{triageTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Last 10 Visits</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>รหัสการเข้ารับบริการ</th>
                  <th>ระดับความรุงเเรง</th>
                  <th>เหตุผล</th>
                  <th>วันที่</th>
                </tr>
              </thead>
              <tbody>
                {live.map((r,idx)=>(
                  <tr key={idx}>
                    <td className="font-mono">{r.vn}</td>
                    <td><TriageBadge value={r.triage} /></td>
                    <td><PtTypeBadge value={r.pt_type} /></td>
                    <td>{r.date_only || "-"}</td>
                  </tr>
                ))}
                {live.length===0 && (
                  <tr><td colSpan={4} className="text-center opacity-60">— No data —</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="stat bg-base-100 rounded-box shadow-sm">
      <div className="stat-title">{title}</div>
      <div className="stat-value text-center">{value ?? 0}</div>
    </div>
  );
}
