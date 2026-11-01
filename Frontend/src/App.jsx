





import "./App.css";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import LandingPage from "./landingpage.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect } from "react";
import { v1 as uuidv1 } from "uuid";

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  // Authentication states
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPage, setAuthPage] = useState("landing");

  // Check existing session
  const checkAuth = async () => {
    try {
      const response = await fetch(
        `https://study-assistant-111.onrender.com/auth/me`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        setUser(null);
        return;
      }

      // Assumes backend returns { user: {...} }
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error("Auth check failed:", err);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Reset chat state after authentication changes
  const resetChat = () => {
    setPrompt("");
    setReply(null);
    setCurrThreadId(uuidv1());
    setPrevChats([]);
    setNewChat(true);
    setAllThreads([]);
  };

  // Logout
  const handleLogout = async () => {
    try {
      const response = await fetch(
       `https://study-assistant-111.onrender.com/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      resetChat();
      setAuthPage("landing");
    } catch (err) {
      console.error(err);
      alert("Unable to logout. Please try again.");
    }
  };

  // Login success: verify session with backend
  const handleLogin = async () => {
    const response = await fetch(
      `https://study-assistant-111.onrender.com/auth/me`,
      {
        credentials: "include",
      }
    );
 
    if (!response.ok) {
      throw new Error(
        "Login succeeded, but session verification failed."
      );
    }

    const data = await response.json();

    if (!data.user) {
      throw new Error(
        "User session was not returned by server."
      );
    }

    setUser(data.user);
    resetChat();
  };

  // Signup success: assumes signup creates a session
  const handleSignup = async () => {
    await handleLogin();
  };

  const providerValues = {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setCurrThreadId,
    newChat,
    setNewChat,
    prevChats,
    setPrevChats,
    allThreads,
    setAllThreads,

    // Authentication values
    user,
    handleLogout,
  };

  // Checking session
  if (authLoading) {
    return (
      <div className="auth-loading">
        Checking session...
      </div>
    );
  }

  // User is not logged in
  if (!user) {
    // Landing / Home page
    if (authPage === "landing") {
      return (
        <LandingPage
          onLogin={() => setAuthPage("login")}
          onSignup={() => setAuthPage("signup")}
          onGetStarted={() => setAuthPage("signup")}
        />
      );
    }

    // Login page
    if (authPage === "login") {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthPage("signup")}
          onBackHome={() => setAuthPage("landing")}
        />
      );
    }

    // Signup page
    if (authPage === "signup") {
      return (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={() => setAuthPage("login")}
          onBackHome={() => setAuthPage("landing")}
        />
      );
    }

    // Fallback
    return (
      <LandingPage
        onLogin={() => setAuthPage("login")}
        onSignup={() => setAuthPage("signup")}
        onGetStarted={() => setAuthPage("signup")}
      />
    );
  }

  // Logged-in user: existing chat application
  return (
    <div className="app">
      <MyContext.Provider value={providerValues}>
        <Sidebar />
        <ChatWindow />
      </MyContext.Provider>
    </div>
  );
}

export default App;
