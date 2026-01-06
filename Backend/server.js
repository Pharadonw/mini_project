const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- DATABASE CONFIG ----------
// การตั้งค่าฐานข้อมูล
const pool = mysql.createPool({
  host: "192.168.1.250",
  user: "north",
  password: "Nakhon@112493317",
  database: "h11249",
  port: 3306,
});

// ---------- TEST API ----------
app.get("/api/patient", async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT fname, lname FROM patient LIMIT 10`);
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// ================================================================
// =======================  DASHBOARD API  =========================
// ================================================================

// 1. SUMMARY (สรุปยอดคนไข้ ER)
app.get("/api/dashboard/summary", async (req, res) => {
  const date = req.query.date;
  // เงื่อนไข: นับทุกคน ยกเว้นคนที่ cancel (7) แต่ถ้านัลล์ (NULL) ให้นับด้วย
  const whereCondition = `WHERE DATE(vstdate) = ? AND (er_leave_status_id != '7' OR er_leave_status_id IS NULL)`;

  const triageSql = `
    SELECT 
      CASE 
        WHEN er_emergency_type = '1' THEN 'Resuscitation'
        WHEN er_emergency_type = '2' THEN 'Emergency'
        WHEN er_emergency_type = '3' THEN 'Urgency'
        WHEN er_emergency_type = '4' THEN 'Semi-Urgency'
        WHEN er_emergency_type = '5' THEN 'Non-Urgency'
        ELSE 'Unknown'
      END AS triage,
      COUNT(*) AS count,
      SUM(CASE WHEN er_leave_status_id = 1 THEN 1 ELSE 0 END)       AS admit,
      SUM(CASE WHEN er_leave_status_id = 8 THEN 1 ELSE 0 END)       AS admitHW,
      SUM(CASE WHEN er_leave_status_id IN (2, 3) THEN 1 ELSE 0 END) AS refer,
      SUM(CASE WHEN er_leave_status_id IN (4, 5, 6) OR er_leave_status_id IS NULL THEN 1 ELSE 0 END) AS dc,
      SUM(CASE WHEN er_leave_status_id = 9 THEN 1 ELSE 0 END)       AS ems
    FROM er_regist
    ${whereCondition}
    GROUP BY er_emergency_type
    ORDER BY FIELD(triage, 'Resuscitation','Emergency','Urgency','Semi-Urgency','Non-Urgency')
  `;

  const totalsSql = `
    SELECT
      COUNT(*) AS total,
      SUM(er_leave_status_id = 1)          AS admit,
      SUM(er_leave_status_id = 8)          AS admitHW,
      SUM(er_leave_status_id IN (2, 3))    AS refer,
      SUM(er_leave_status_id IN (4, 5, 6) OR er_leave_status_id IS NULL) AS dc,
      SUM(er_leave_status_id = 9)          AS ems
    FROM er_regist
    ${whereCondition}
  `;

  try {
    const [[triageRows], [totalsRows]] = await Promise.all([
      pool.query(triageSql, [date]),
      pool.query(totalsSql, [date]),
    ]);
    res.json({ date, rows: triageRows, totals: totalsRows[0] || {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "summary query error" });
  }
});

// 2. SERIES (กราฟตามเวร)
app.get("/api/dashboard/series", async (req, res) => {
  const date = req.query.date;
  const sql = `
    SELECT er_period AS t, COUNT(*) AS c
    FROM er_regist
    WHERE DATE(vstdate) = ?
    GROUP BY er_period
    ORDER BY FIELD(er_period,'เช้า','บ่าย','ดึก','กลางวัน','กลางคืน'), er_period
  `;
  try {
    const [rows] = await pool.query(sql, [date]);
    res.json({ date, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "series query error" });
  }
});

// 3. LIVE (10 รายการล่าสุด)
app.get("/api/dashboard/live", async (req, res) => {
  const date = req.query.date;
  const sql = `
    SELECT 
      vn,
      er_emergency_type AS triage,
      er_pt_type AS pt_type,
      DATE_FORMAT(vstdate, '%Y-%m-%d %H:%i:%s') AS date_only
    FROM er_regist
    WHERE DATE(vstdate) = ?
    ORDER BY vstdate DESC
    LIMIT 10
  `;
  try {
    const [rows] = await pool.query(sql, [date]);
    res.json({ date, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "live query error" });
  }
});

// 4. ER CASES (ตารางผู้ป่วยในหน้า Dashboard)
app.get("/api/dashboard/er-cases", async (req, res) => {
  const date = req.query.date;
  const sql = `
    SELECT 
      r.vn,
      DATE_FORMAT(r.vsttime, '%H:%i') AS time,
      CONCAT(IFNULL(p.fname,''), ' ', IFNULL(p.lname,'')) AS name,
      r.pe_cc AS symptom,
      r.er_emergency_type AS triage,
      r.er_leave_status_id AS status_id
    FROM er_regist r
    LEFT JOIN patient p ON r.hn = p.hn
    WHERE DATE(r.vstdate) = ?
    ORDER BY r.vsttime DESC
  `;
  try {
    const [rows] = await pool.query(sql, [date]);
    res.json({ date, rows });
  } catch (err) {
    console.error("ER Cases Error:", err);
    res.status(500).json({ error: "er-cases query error" });
  }
});

// ================================================================
// =======================  ADMIT PAGE API  =======================
// ================================================================

// 5. ADMIT MONITOR (แก้ไขล่าสุด: ดึงชื่อ Ward ตรงๆ จากตาราง ward)
app.get("/api/dashboard/admit", async (req, res) => {
  const sql = `
    SELECT 
      i.an, i.vn, i.hn,
      p.cid,
      CONCAT(IFNULL(p.pname,''), IFNULL(p.fname,''), ' ', IFNULL(p.lname,'')) AS pt_name,
      
      a.age_y AS age,
      a.sex,
      
      DATE_FORMAT(i.regdate, '%Y-%m-%d') AS regdate,
      i.regtime,
      i.provision_dx AS dx,
      
      d.name AS doctor_name,
      pt.name AS pttype_name,
      a.pttypeno,
      
      w.name AS ward_name  -- << ดึงชื่อตึก (เช่น "อายุรกรรม MED") มาโชว์เลย

    FROM ipt i
      LEFT JOIN an_stat a ON i.an = a.an
      LEFT JOIN patient p ON i.hn = p.hn
      LEFT JOIN doctor d ON i.admdoctor = d.code
      LEFT JOIN pttype pt ON i.pttype = pt.pttype
      
      -- Join ตาราง ward เพื่อแปลงรหัส 01,02 เป็นชื่อตึก
      LEFT JOIN ward w ON i.ward = w.ward 
      
    WHERE 
      (i.confirm_discharge IS NULL OR i.confirm_discharge != 'Y')
      
    ORDER BY i.regdate DESC, i.regtime DESC
  `;

  try {
    const [rows] = await pool.query(sql);
    res.json({ rows });
  } catch (err) {
    console.error("Admit API Error:", err);
    res.status(500).json({ error: "Admit query error" });
  }
});

// ================================================================
// ========================  START SERVER  =========================
// ================================================================
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});