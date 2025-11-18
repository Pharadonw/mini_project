import { useEffect, useState } from "react";

function Emergency() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/patient")
      .then(res => res.json())
      .then(data => {
        setPatients(data);
      })
      .catch(err => {
        console.error("Error fetching data:", err);
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>รายชื่อผู้ป่วย</h1>

      {patients.length === 0 ? (
        <p>กำลังโหลดข้อมูล...</p>
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

export default Emergency ;
