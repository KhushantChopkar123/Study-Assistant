
import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);

    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }

        if (!prevChats?.length) return;

        const content = reply.split(" ");
        let idx = 0;

        const interval = setInterval(() => {
            setLatestReply(
                content.slice(0, idx + 1).join(" ")
            );

            idx++;

            if (idx >= content.length) {
                clearInterval(interval);
            }
        }, 40);

        return () => clearInterval(interval);
    }, [prevChats, reply]);

    // Render user attachments
    const renderAttachments = (attachments = []) => {
        if (!attachments.length) return null;

        return (
            <div className="chatAttachments">
                {attachments.map((file, index) => {
                    // Support both new previews and saved URLs
                    const imageSrc = file.preview || file.url;

                    const isImage =
                        file.mimetype?.startsWith("image/");

                    return (
                        <div
                            className="chatAttachment"
                            key={`${file.filename}-${index}`}
                        >
                            {isImage && imageSrc ? (
                                <img
                                    className="chatAttachmentImage"
                                    src={imageSrc}
                                    alt={
                                        file.filename ||
                                        "Uploaded image"
                                    }
                                    onClick={() => {
                                        window.open(
                                            imageSrc,
                                            "_blank",
                                            "noopener,noreferrer"
                                        );
                                    }}
                                />
                            ) : (
                                <div className="chatAttachmentFile">
                                    <i className="fa-solid fa-file-pdf"></i>

                                    <div>
                                        <p>
                                            {file.filename ||
                                                "Attached file"}
                                        </p>

                                        <small>
                                            {file.mimetype ===
                                            "application/pdf"
                                                ? "PDF document"
                                                : "Attachment"}
                                        </small>

                                        {file.url && (
                                            <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Open attachment
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}

            <div className="chats">
                {prevChats?.slice(0, -1).map((chat, idx) => (
                    <div
                        className={
                            chat.role === "user"
                                ? "userDiv"
                                : "gptDiv"
                        }
                        key={idx}
                    >
                        {chat.role === "user" ? (
                            <>
                                {renderAttachments(chat.attachments)}

                                <p className="userMessage">
                                    {chat.content}
                                </p>
                            </>
                        ) : (
                            <ReactMarkdown
                                rehypePlugins={[rehypeHighlight]}
                            >
                                {chat.content}
                            </ReactMarkdown>
                        )}
                    </div>
                ))}

                {prevChats?.length > 0 && (
                    <>
                        {prevChats[
                            prevChats.length - 1
                        ].role === "user" ? (
                            <div className="userDiv">
                                {renderAttachments(
                                    prevChats[
                                        prevChats.length - 1
                                    ].attachments
                                )}

                                <p className="userMessage">
                                    {
                                        prevChats[
                                            prevChats.length - 1
                                        ].content
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="gptDiv">
                                {latestReply === null ? (
                                    <ReactMarkdown
                                        rehypePlugins={[
                                            rehypeHighlight,
                                        ]}
                                    >
                                        {
                                            prevChats[
                                                prevChats.length - 1
                                            ].content
                                        }
                                    </ReactMarkdown>
                                ) : (
                                    <ReactMarkdown
                                        rehypePlugins={[
                                            rehypeHighlight,
                                        ]}
                                    >
                                        {latestReply}
                                    </ReactMarkdown>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}

export default Chat;
