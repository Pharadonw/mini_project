import { NavLink } from "react-router-dom";
import React from "react";
import Logo from "../assets/img/Logo1.png";

const cls = (is) => (is ? "btn btn-sm btn-primary" : "btn btn-sm btn-ghost");


export default function Navbar() {
  return (
    <div className="w-full border-b bg-base-100">
      <div className="max-w-6xl mx-auto p-2 flex gap-12">
        <NavLink to="/"          className={({isActive})=>cls(isActive)}>หน้าหลัก</NavLink> 
        <NavLink to="/dashboard" className={({isActive})=>cls(isActive)}>Admit</NavLink>
        <NavLink to="/er-daily"  className={({isActive})=>cls(isActive)}>Refer</NavLink>
      </div>
    </div>
  );
}
