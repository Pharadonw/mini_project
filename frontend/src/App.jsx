import Header from "./components/Hesder";
import Personlist from "./components/Personlist";
import Emergency from "./components/Emergency";
import PatientList from "./components/PatientList";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Header/>
      <Navbar/>
      <Personlist />
      <Emergency />
      <PatientList />
    </>
  );
}

export default App;
