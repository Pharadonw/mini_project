// src/components/Bar.jsx
import React from "react";
import Logo from "../assets/img/Logo1.png";

export default function Bar() {
  return (
    <nav className="bg-yellow-200 text-gray-900 border-b border-gray-300">
      <div className="container mx-auto max-w-[1320px] relative h-auto p-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <img src={Logo} alt="Logo" className="h-10 w-auto" />
          <span className="font-semibold text-lg">My App</span>
        </a>

        <ul className="flex items-center gap-6">
          <li><a href="#" className="link link-hover">Home</a></li>
          <li><a href="#" className="link link-hover">About</a></li>
          <li><a href="#" className="btn btn-sm btn-primary text-white">Button</a></li>
        </ul>
      </div>
    </nav>
  );
}
