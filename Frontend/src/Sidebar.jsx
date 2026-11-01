

import "./Sidebar.css";
import logo from "./assets/icon.png";

import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats
    } = useContext(MyContext);

    const [currentUser, setCurrentUser] = useState(null);

    // Fetch logged-in user's profile
    useEffect(() => {
        let isMounted = true;

        const getCurrentUser = async () => {
            try {
                const response = await fetch(
                    "https://study-assistant-111.onrender.com/auth/me",
                    {
                        credentials: "include"
                    }
                );

                if (!response.ok) {
                    if (isMounted) setCurrentUser(null);
                    return;
                }

                const data = await response.json();

                // Supports either { user: {...} } or direct user object
                const user = data.user ?? data;

                if (isMounted) {
                    setCurrentUser(user);
                }
            } catch (err) {
                console.error("Error fetching user:", err);
                if (isMounted) setCurrentUser(null);
            }
        };

        getCurrentUser();

        return () => {
            isMounted = false;
        };
    }, []);

    // Fetch logged-in user's chat history
    const getAllThreads = async () => {
        try {
            const response = await fetch(
                "https://study-assistant-111.onrender.com/api/thread",
                {
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch chat history");
            }

            const res = await response.json();

            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title
            }));

            setAllThreads(filteredData);
        } catch (err) {
            console.error("Error fetching threads:", err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId]);

    // Create new chat
    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    // Open existing chat
    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(
                `https://study-assistant-111.onrender.com/api/thread/${encodeURIComponent(newThreadId)}`,
                {
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load chat");
            }

            const res = await response.json();

            setPrevChats(res);
            setNewChat(false);
            setReply(null);
            setPrompt("");
        } catch (err) {
            console.error("Error loading chat:", err);
        }
    };

    // Delete a chat
    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(
                `https://study-assistant-111.onrender.com/api/thread/${encodeURIComponent(threadId)}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete thread");
            }

            const res = await response.json();
            console.log(res);

            setAllThreads((prev) =>
                prev.filter((thread) => thread.threadId !== threadId)
            );

            // If deleted chat is currently open, start a new chat
            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.error("Error deleting thread:", err);
        }
    };

    // Logged-in user's profile details
    const userName =
        currentUser?.name?.trim() || "My Account";

    const userInitial =
        userName === "My Account"
            ? "U"
            : userName.charAt(0).toUpperCase();

    return (
        <section className="sidebar">

            {/* New Chat */}
            <button
                className="sidebar-new-chat"
                onClick={createNewChat}
                type="button"
            >
                <img
                    src={logo}
                    alt="Study AI logo"
                    className="logo"
                />

                <span>
                    <i className="fa-solid fa-pen-to-square"></i>
                </span>
            </button>

            {/* Chat History */}
            <ul className="history">
                {allThreads?.map((thread) => (
                    <li
                        key={thread.threadId}
                        onClick={() => changeThread(thread.threadId)}
                        className={
                            thread.threadId === currThreadId
                                ? "highlighted"
                                : ""
                        }
                    >
                        <span className="thread-title">
                            {thread.title}
                        </span>

                        <i
                            className="fa-solid fa-trash"
                            role="button"
                            tabIndex={0}
                            aria-label={`Delete ${thread.title}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteThread(thread.threadId);
                            }}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" ||
                                    e.key === " "
                                ) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    deleteThread(thread.threadId);
                                }
                            }}
                        ></i>
                    </li>
                ))}
            </ul>

            {/* Logged-in User Profile */}
            <div className="sidebar-profile">
                <div className="profile-avatar">
                    {userInitial}
                </div>

                <div className="profile-info">
                    <span
                        className="profile-name"
                        title={userName}
                    >
                        {userName}
                    </span>

                    <span className="profile-label">
                        Personal account
                    </span>
                </div>

                <i
                    className="fa-solid fa-circle-check profile-status"
                    title="Signed in"
                    aria-label="Signed in"
                ></i>
            </div>

        </section>
    );
}

export default Sidebar;


