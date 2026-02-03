// src/App.jsx
import Header from "./components/Header.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import List from "./components/List.jsx";
import Refer from "./components/Refer.jsx"; 
import { Routes, Route } from "react-router-dom";
import Admit from "./components/Admit.jsx";
import Charts from "./components/Charts1.jsx";
import WeeklyChart from "./components/WeeklyChart";
import Charts1 from "./components/Charts1.jsx";

export default function App() {
  return (
    <>
      <Header/>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patient" element={<List />} />
        <Route path="/Admitcase" element={<Admit/>} />        
        <Route path="/Refercase" element={<Refer/>} />
        <Route path="*" element={<div style={{padding:16}}>Not Found</div>} />
      </Routes>
      <Charts1/>
      <WeeklyChart/>
    </>
  );
}
