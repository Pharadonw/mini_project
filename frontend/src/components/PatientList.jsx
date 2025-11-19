// src/PatientList.jsx
import { useEffect, useState } from "react";

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);   // state สำหรับโหลด
  const [error, setError] = useState(null);       // state สำหรับ error

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("/api/patient"); // เรียก API จาก backend
        if (!res.ok) {
          throw new Error("HTTP error " + res.status);
        }
        const data = await res.json(); // data = array ของ patient
        setPatients(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("ดึงข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  if (loading) return <p>กำลังโหลดข้อมูล...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>รายชื่อคนไข้</h2>
      {patients.length === 0 ? (
        <p>ไม่มีข้อมูลคนไข้</p>
      ) : (
        <ul>
          {patients.map((p, index) => (
            <li key={index}>
              {p.fname} {p.lname}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PatientList;