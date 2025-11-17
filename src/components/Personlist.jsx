import { useState } from "react";
function Personlist (){

     const name = "fah"
     const [age,setAge] = useState(30)
        return (
       <>
         <h1>หัวใหญ่{name}</h1>
         <h3> หัวย่อย{age} ปี</h3>
         <button> Up </button>
         <button> Down </button>
       </>
        )
}

export default Personlist