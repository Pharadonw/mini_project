import { useState } from "react";

function Personlist() {

  const name = "fah";
  const [age, setAge] = useState(30);

  return (
    <>
      <h1> ชื่อ {name}</h1>
      <h3> อายุ {age} ปี</h3>

      <button> Up </button>
      <button> Down </button>
      
    </>
  );
}

export default Personlist;
