import { useEffect } from "react";
import Home from "./pages/Home";
import getCurrentUser from "./features/getCurrentUser";
import { useDispatch } from "react-redux";
import { setAuthChecked, setUserdata } from "./redux/userSlice";

function App() {
  const dispatch=useDispatch()
useEffect(() => {
  const getUser = async () => {
   const data= await getCurrentUser();
   dispatch(setUserdata(data))
   dispatch(setAuthChecked(true))
  };

  getUser();
}, []);

return <Home />;
}

export default App;