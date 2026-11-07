import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../../utils/firebase";
import api from "../../utils/axios";
import { FcGoogle } from "react-icons/fc";
import { useDispatch, useSelector } from "react-redux";
import { useCallback, useState } from "react";
import { setAuthChecked, setUserdata } from "../redux/userSlice";

// Change these paths if your components are located somewhere else
import SideBar from "../components/SideBar";
import ChatArea from "../components/ChatArea";
import Artifact from "../components/Artifact";

function Home() {
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(true);
  const { userData, authChecked } = useSelector((state) => state.user);
  const artifacts = useSelector((state) => state.message.artifacts);
  const dispatch = useDispatch();
  const openArtifacts = useCallback(() => setArtifactPanelOpen(true), []);

  const handleLogin = async (token) => {
    try {
      const { data } = await api.post("/api/auth/login", { token });
      dispatch(setUserdata(data));
      dispatch(setAuthChecked(true));
      return data;
    } catch (error) {
      console.error("Backend login failed:", error);
      return null;
    }
  };

  const handleGoogleLogout = async () => {
    try {
      if (userData) {
        await api.post("/api/auth/logout");
      }
    } catch (error) {
      console.error("Backend logout failed:", error);
    }

    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Firebase logout failed:", error);
    }

    dispatch(setUserdata(null));
    dispatch(setAuthChecked(true));
  };

  const googleLogin = async () => {
    try {
      if (!auth || !googleProvider) {
        throw new Error("Google auth is not initialized.");
      }

      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn("Sign-out before login was ignored:", signOutError);
      }

      googleProvider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, googleProvider);
      const user = result?.user;

      if (!user) {
        throw new Error("Google sign-in did not return a user.");
      }

      const token = await user.getIdToken(true).catch(() => null);

      if (!token) {
        throw new Error("No Firebase ID token returned from Google sign-in.");
      }

      const data = await handleLogin(token);

      if (!data) {
        throw new Error(
          "Google login failed because the backend did not return a session."
        );
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        error;

      console.error("Google login failed:", message);
    }
  };

  return (
    <div className="h-screen flex bg-[#0d0f14] text-white overflow-hidden">
      <SideBar onGoogleLogin={googleLogin} onGoogleLogout={handleGoogleLogout} />
      <ChatArea
        artifactPanelOpen={artifactPanelOpen}
        onOpenArtifacts={openArtifacts}
      />
      {artifactPanelOpen && artifacts.length > 0 && (
        <Artifact onClose={() => setArtifactPanelOpen(false)} />
      )}

      {authChecked && !userData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-[17px] font-semibold text-slate-100 tracking-tight">
                Welcome to CortexAI
              </h2>

              <p className="text-sm text-slate-400">
                Please login to continue using the app.
              </p>
            </div>

            <button
              className="w-full flex items-center justify-center gap-3 py-[11px] rounded-xl text-sm font-medium text-black/90 bg-white border border-slate-200 shadow-sm hover:bg-gray-100 transition-all duration-150 cursor-pointer"
              onClick={googleLogin}
            >
              <FcGoogle size={15} />
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;