



import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useRef } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadId,
        setPrevChats,
        setNewChat,
        handleLogout,
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [attachments, setAttachments] = useState([]);

    const fileInputRef = useRef(null);

    // Select files
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);

        const validFiles = files.filter(
            (file) =>
                file.type.startsWith("image/") ||
                file.type === "application/pdf"
        );

        if (validFiles.length !== files.length) {
            alert("Only PDF files and images are allowed.");
        }

        setAttachments((prev) => {
            const combined = [...prev, ...validFiles];

            // Remove duplicate selections
            const uniqueFiles = combined.filter(
                (file, index, arr) =>
                    arr.findIndex(
                        (f) =>
                            f.name === file.name &&
                            f.size === file.size &&
                            f.lastModified === file.lastModified
                    ) === index
            );

            if (uniqueFiles.length > 5) {
                alert("Maximum 5 attachments allowed.");
                return uniqueFiles.slice(0, 5);
            }

            return uniqueFiles;
        });

        // Allow selecting the same file again
        e.target.value = "";
    };

    // Remove attachment
    const removeAttachment = (indexToRemove) => {
        setAttachments((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
        );
    };

    // Convert selected file into a preview URL
    const fileToDataURL = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () =>
                reject(new Error(`Could not read ${file.name}`));

            reader.readAsDataURL(file);
        });

    // Send message and attachments
    const getReply = async () => {
        const message = prompt.trim();

        if ((!message && attachments.length === 0) || loading) {
            return;
        }

        setLoading(true);
        setNewChat(false);

        try {
            const formData = new FormData();

            formData.append("message", message);
            formData.append("threadId", currThreadId || "");

            // Attach selected files
            attachments.forEach((file) => {
                formData.append("attachments", file);
            });

            const response = await fetch(
                "http://localhost:8080/api/chat",
                {
                    method: "POST",
                    credentials: "include",
                    body: formData,
                }
            );

            let res;

            try {
                res = await response.json();
            } catch {
                throw new Error(
                    `Server returned an invalid response (${response.status})`
                );
            }

            if (response.status === 401) {
                throw new Error(
                    "Session expired. Please log in again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    res.error ||
                    res.message ||
                    `Request failed (${response.status})`
                );
            }

            if (typeof res.reply !== "string") {
                throw new Error("Invalid reply received from server.");
            }

            // Prepare attachments for frontend conversation history
            const savedAttachments = await Promise.all(
                attachments.map(async (file) => ({
                    filename: file.name,
                    mimetype: file.type,
                    size: file.size,
                    preview: file.type.startsWith("image/")
                        ? await fileToDataURL(file)
                        : null,
                }))
            );

            // Add user message and assistant response to chat state
            setPrevChats((prevChats) => [
                ...prevChats,
                {
                    role: "user",
                    content: message || "Sent attachments",
                    attachments: savedAttachments,
                },
                {
                    role: "assistant",
                    content: res.reply,
                },
            ]);

            setReply(res.reply);
            setPrompt("");
            setAttachments([]);
        } catch (err) {
            console.error("Chat request error:", err);

            alert(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileClick = () => {
        setIsOpen((prev) => !prev);
    };

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>
                    SigmaGPT{" "}
                    <i className="fa-solid fa-chevron-down"></i>
                </span>

                <div
                    className="userIconDiv"
                    onClick={handleProfileClick}
                >
                    <span className="userIcon">
                        <i className="fa-solid fa-user"></i>
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="dropDown">
                    <div className="dropDownItem">
                        <i className="fa-solid fa-gear"></i>
                        Settings
                    </div>

                    <div className="dropDownItem">
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        Upgrade plan
                    </div>

                    <div
                        className="dropDownItem"
                        onClick={() => {
                            setIsOpen(false);
                            handleLogout();
                        }}
                    >
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        Log out
                    </div>
                </div>
            )}

            <Chat />

            <ScaleLoader color="#fff" loading={loading} />

            <div className="chatInput">
                <div className="inputBox">
                    {/* File picker */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        multiple
                        hidden
                        onChange={handleFileChange}
                    />

                    {/* Attachment previews */}
                    {attachments.length > 0 && (
                        <div className="attachmentPreview">
                            {attachments.map((file, index) => (
                                <div
                                    className="attachmentCard"
                                    key={`${file.name}-${file.size}-${file.lastModified}`}
                                >
                                    {file.type.startsWith("image/") ? (
                                        <img
                                            className="attachmentThumbnail"
                                            src={URL.createObjectURL(file)}
                                            alt={file.name}
                                        />
                                    ) : (
                                        <div className="attachmentFileIcon">
                                            <i className="fa-solid fa-file-pdf"></i>
                                        </div>
                                    )}

                                    <div className="attachmentInfo">
                                        <span className="attachmentName">
                                            {file.name}
                                        </span>

                                        <span className="attachmentSize">
                                            {file.type === "application/pdf"
                                                ? "PDF document"
                                                : "Image"}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="removeAttachment"
                                        title="Remove attachment"
                                        aria-label={`Remove ${file.name}`}
                                        disabled={loading}
                                        onClick={() =>
                                            removeAttachment(index)
                                        }
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Input row */}
                    <div className="messageInputRow">
                        <button
                            type="button"
                            className="attachButton"
                            title="Attach files"
                            aria-label="Attach files"
                            disabled={loading}
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                        >
                            <i className="fa-solid fa-plus"></i>
                        </button>

                        <input
                            placeholder="Ask anything"
                            value={prompt}
                            disabled={loading}
                            onChange={(e) =>
                                setPrompt(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    !e.shiftKey
                                ) {
                                    e.preventDefault();
                                    getReply();
                                }
                            }}
                        />

                        <button
                            type="button"
                            className="sendButton"
                            onClick={getReply}
                            disabled={loading}
                            aria-label="Send message"
                        >
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <p className="info">
                    SigmaGPT can make mistakes. Check important info.
                    See Cookie Preferences.
                </p>
            </div>
        </div>
    );
}

export default ChatWindow;

