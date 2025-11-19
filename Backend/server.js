const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors());
app.use(express.json());

// เชื่อมไปที่ DB 192.168.1.250
const pool = mysql.createPool({
 // host: "192.168.1.250",
  //user: "snk11249",
  //password: "1124911249",
  //database: "h11249",
  //port: 3306,

  host: "192.168.1.250",
  user: "north",
  password: "Nakhon@112493317",
  database: "h11249",
  port: 3306,

  
});

// ทดสอบดึงข้อมูลจากตาราง patient (fname, lname)
app.get("/api/patient", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT fname, lname FROM patient");
    res.json(rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
