import Header from "./components/Header.jsx";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import List from "./components/List.jsx";
import { Routes, Route } from "react-router-dom";
import Admit from "./components/Admit.jsx";

export default function App() {
  return (
    <>
      <Header/>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/patient" element={<List />} />
        <Route path="/Admitcase" element={<Admit/>} />        
        <Route path="*" element={<div style={{padding:16}}>Not Found</div>} />
      </Routes>
    </>
  );
}