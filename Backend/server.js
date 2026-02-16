const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors());
app.use(express.json());

// ---------- DATABASE CONFIG ----------
const pool = mysql.createPool({
  host: process.env.DB_HOST || "192.168.1.250",
  user: process.env.DB_USER || "north",
  password: process.env.DB_PASSWORD || "Nakhon@112493317",
  database: process.env.DB_NAME || "h11249",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  queueLimit: 0
});

// ================================================================
// =======================  DASHBOARD API  =========================
// ================================================================

// 1. SUMMARY
app.get("/api/dashboard/summary", async (req, res) => {
  const date = req.query.date;
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
      SUM(er_leave_status_id = 1)           AS admit,
      SUM(er_leave_status_id = 8)           AS admitHW,
      SUM(er_leave_status_id IN (2, 3))     AS refer,
      SUM(er_leave_status_id IN (4, 5, 6) OR er_leave_status_id IS NULL) AS dc,
      SUM(er_leave_status_id = 9)           AS ems
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

// 2. SERIES
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

// 3. LIVE
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

// 4. ER CASES
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
    LEFT JOIN vn_stat v ON r.vn = v.vn  
    LEFT JOIN patient p ON v.hn = p.hn  
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
      w.name AS ward_name
    FROM ipt i
      LEFT JOIN an_stat a ON i.an = a.an
      LEFT JOIN patient p ON i.hn = p.hn
      LEFT JOIN doctor d ON i.admdoctor = d.code
      LEFT JOIN pttype pt ON i.pttype = pt.pttype
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
// =======================  CHARTS API (FIXED)  ===================
// ================================================================

app.get("/api/dashboard/charts", async (req, res) => {
  const queryDateStr = req.query.date; // วันที่ส่งมา
  const type = req.query.type;         // 'daily' หรือ 'weekly'
  
  // Common Condition
  const baseCondition = `(r.er_leave_status_id != '7' OR r.er_leave_status_id IS NULL)`;

  try {
    // ---------------------------------------------------------
    // CASE 1: DAILY (แก้ไขเพิ่มการดึงข้อมูล Severity, Gender, Age)
    // ---------------------------------------------------------
    if (type === 'daily') {
      
      // 1. Hourly Pattern (เดิม)
      const hourlySql = `
        SELECT HOUR(r.leave_datetime) as hour_val, COUNT(*) as count
        FROM er_regist r
        WHERE r.vstdate = ? 
        AND ${baseCondition}
        AND r.leave_datetime IS NOT NULL 
        GROUP BY HOUR(r.leave_datetime)
        ORDER BY hour_val ASC
      `;

      // 2. Demographics (Gender & Age) - เพิ่มใหม่
      const demoSql = `
        SELECT 
          p.sex, 
          TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) as age
        FROM er_regist r
        LEFT JOIN vn_stat v ON r.vn = v.vn 
        LEFT JOIN patient p ON v.hn = p.hn 
        WHERE r.vstdate = ? 
        AND ${baseCondition}
      `;

      // 3. Severity (Triage) - เพิ่มใหม่
      const severitySql = `
        SELECT r.er_emergency_type as triage, COUNT(*) as count
        FROM er_regist r
        WHERE r.vstdate = ? 
        AND ${baseCondition}
        GROUP BY r.er_emergency_type
      `;

      // รัน Query พร้อมกัน 3 ตัว
      const [[hourlyRows], [demoRows], [severityRows]] = await Promise.all([
        pool.query(hourlySql, [queryDateStr]),
        pool.query(demoSql, [queryDateStr]),
        pool.query(severitySql, [queryDateStr])
      ]);

      // --- Format Data ---

      // A. Hourly
      const formattedHourly = Array.from({ length: 24 }, (_, i) => {
        const found = hourlyRows.find(row => row.hour_val === i);
        return { 
          time: `${String(i).padStart(2, '0')}:00`, 
          patients: found ? found.count : 0 
        };
      });

      // B. Gender & Age
      let genderCount = { male: 0, female: 0 };
      let ageCount = { child: 0, adult: 0, elderly: 0 };

      demoRows.forEach(row => {
        // Gender
        if (row.sex === '1') genderCount.male++;
        else if (row.sex === '2') genderCount.female++;

        // Age
        const age = row.age;
        if (age !== null && age !== undefined) {
          if (age < 15) ageCount.child++;
          else if (age >= 60) ageCount.elderly++;
          else ageCount.adult++;
        }
      });

      // C. Severity
      const formattedSeverity = severityRows.reduce((acc, row) => {
        if(row.triage) acc[row.triage] = row.count;
        return acc;
      }, {});

      // Return ข้อมูลครบถ้วนสำหรับ Daily
      return res.json({ 
        mode: 'daily',
        hourly: formattedHourly,
        gender: genderCount,
        age: ageCount,
        severity: formattedSeverity
      });
    }

    // ---------------------------------------------------------
    // CASE 2: WEEKLY
    // ---------------------------------------------------------
    else {
      // 1. คำนวณช่วงวันที่ (Start - End)
      const endDate = new Date(queryDateStr);
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6); // ย้อนหลัง 6 วัน

      const f_endDate = endDate.toISOString().slice(0, 10);
      const f_startDate = startDate.toISOString().slice(0, 10);

      // 2. ข้อมูลประชากร (Gender & Age)
      const demoSql = `
        SELECT 
          p.sex, 
          TIMESTAMPDIFF(YEAR, p.birthday, CURDATE()) as age
        FROM er_regist r
        LEFT JOIN vn_stat v ON r.vn = v.vn 
        LEFT JOIN patient p ON v.hn = p.hn 
        WHERE r.vstdate >= ? AND r.vstdate <= ? 
        AND ${baseCondition}
      `;

      // 3. ความรุนแรง (Severity / Triage)
      const severitySql = `
        SELECT r.er_emergency_type as triage, COUNT(*) as count
        FROM er_regist r
        WHERE r.vstdate >= ? AND r.vstdate <= ? 
        AND ${baseCondition}
        GROUP BY r.er_emergency_type
      `;

      // 4. Weekly Total (กราฟแท่ง)
      const weeklySql = `
        SELECT vstdate as date_val, COUNT(*) as count
        FROM er_regist r
        WHERE r.vstdate >= ? AND r.vstdate <= ? 
          AND ${baseCondition}
        GROUP BY r.vstdate
      `;

      // 5. Weekly Pattern
      const weeklyPatternSql = `
        SELECT HOUR(r.leave_datetime) as hour_val, COUNT(*) as count
        FROM er_regist r
        WHERE r.vstdate >= ? AND r.vstdate <= ? 
          AND ${baseCondition}
          AND r.leave_datetime IS NOT NULL
        GROUP BY HOUR(r.leave_datetime)
        ORDER BY hour_val ASC
      `;

      // Execute Queries
      const [[demoRows], [severityRows], [weeklyRows], [weeklyPatternRows]] = await Promise.all([
        pool.query(demoSql, [f_startDate, f_endDate]),
        pool.query(severitySql, [f_startDate, f_endDate]),
        pool.query(weeklySql, [f_startDate, f_endDate]),
        pool.query(weeklyPatternSql, [f_startDate, f_endDate])
      ]);

      // --- Format Data ---
      
      // Gender & Age
      let genderCount = { male: 0, female: 0 };
      let ageCount = { child: 0, adult: 0, elderly: 0 };

      demoRows.forEach(row => {
        if (row.sex === '1') genderCount.male++;
        else if (row.sex === '2') genderCount.female++;

        const age = row.age;
        if (age !== null && age !== undefined) {
          if (age < 15) ageCount.child++;
          else if (age >= 60) ageCount.elderly++;
          else ageCount.adult++;
        }
      });

      // Severity
      const formattedSeverity = severityRows.reduce((acc, row) => {
        if(row.triage) acc[row.triage] = row.count;
        return acc;
      }, {});

      // Weekly Pattern
      const formattedWeeklyPattern = Array.from({ length: 24 }, (_, i) => {
        const found = weeklyPatternRows.find(row => row.hour_val === i);
        return { 
          time: `${String(i).padStart(2, '0')}:00`, 
          patients: found ? found.count : 0 
        };
      });

      // Return ข้อมูลรายสัปดาห์
      return res.json({
        mode: 'weekly',
        severity: formattedSeverity,
        gender: genderCount,
        age: ageCount,
        weeklyPattern: formattedWeeklyPattern,
        weeklyTotal: weeklyRows
      });
    }

  } catch (err) {
    console.error("Charts API Error:", err);
    res.status(500).json({ error: "Charts query error" });
  }
});

// ================================================================
// ========================  START SERVER  =========================
// ================================================================
const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});