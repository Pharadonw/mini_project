import { useState } from "react";

function Personlist() {

  const name = "North";
  const [age, setAge] = useState(22);

  return (
    <>
      <h1> ชื่อ {name}</h1>
      <h2> อายุ {age} ปี</h2>

      <button> Up </button>
      <button> Down </button>
      
    </>
  );
}
export default Personlist;
