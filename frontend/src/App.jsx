// src/App.jsx
import Header from "./components/Header.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import List from "./components/List.jsx";
import ER_case from "./components/ER_case.jsx"; 
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <>
    <button className="btn btn-primary m-4">ทดสอบ DaisyUI</button>
<div className="bg-blue-500 text-white p-3 rounded-lg">Tailwind OK</div>


      <Header />
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patient" element={<List />} />
        <Route path="/er-daily" element={<ER_case />} />
        <Route path="*" element={<div style={{padding:16}}>Not Found</div>} />
      </Routes>
    </>
  );
}
