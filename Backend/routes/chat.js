

import express from "express";
import rateLimit from "express-rate-limit";
import multer from "multer";

import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/geminiAIAPI.js";

const router = express.Router();

// Rate limiter
const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many requests. Please try again later.",
  },
});

// Authentication
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Please login first.",
    });
  }

  next();
}

// Frontend origin validation
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

router.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: "Origin not allowed.",
    });
  }

  next();
});

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5,
  },

  fileFilter: (req, file, cb) => {
    const allowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf";

    if (!allowed) {
      return cb(
        new Error("Only images and PDFs are allowed.")
      );
    }

    cb(null, true);
  },
});

// Handle uploads
function handleUpload(req, res, next) {
  upload.array("attachments", 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.message,
      });
    }

    next();
  });
}

// GET all threads
router.get("/thread", requireAuth, async (req, res) => {
  try {
    const threads = await Thread.find({
      owner: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .select("threadId title createdAt updatedAt");

    res.json(threads);
  } catch (error) {
    console.error("Fetch threads error:", error);

    res.status(500).json({
      error: "Failed to fetch threads.",
    });
  }
});

// GET one thread with messages
router.get(
  "/thread/:threadId",
  requireAuth,
  async (req, res) => {
    try {
      const { threadId } = req.params;

      if (!threadId || threadId.length > 200) {
        return res.status(400).json({
          error: "Invalid thread ID.",
        });
      }

      const thread = await Thread.findOne({
        threadId,
        owner: req.user._id,
      }).lean();

      if (!thread) {
        return res.status(404).json({
          error: "Thread not found.",
        });
      }

      res.json(thread.messages);
    } catch (error) {
      console.error("Fetch thread error:", error);

      res.status(500).json({
        error: "Failed to fetch chat history.",
      });
    }
  }
);

// DELETE thread
router.delete(
  "/thread/:threadId",
  requireAuth,
  async (req, res) => {
    try {
      const thread = await Thread.findOneAndDelete({
        threadId: req.params.threadId,
        owner: req.user._id,
      });

      if (!thread) {
        return res.status(404).json({
          error: "Thread not found.",
        });
      }

      res.json({
        message: "Thread deleted successfully.",
      });
    } catch (error) {
      console.error("Delete thread error:", error);

      res.status(500).json({
        error: "Failed to delete thread.",
      });
    }
  }
);

// POST chat
router.post(
  "/chat",
  requireAuth,
  chatLimiter,
  handleUpload,
  async (req, res) => {
    try {
      const { threadId, message } = req.body;

      const cleanMessage =
        typeof message === "string" ? message.trim() : "";

      const attachments = req.files || [];

      if (
        !threadId ||
        typeof threadId !== "string" ||
        threadId.length > 200
      ) {
        return res.status(400).json({
          error: "Invalid thread ID.",
        });
      }

      if (cleanMessage.length > 10000) {
        return res.status(400).json({
          error: "Message is too long.",
        });
      }

      if (!cleanMessage && attachments.length === 0) {
        return res.status(400).json({
          error: "Message or attachment is required.",
        });
      }

      // Find or create thread owned by logged-in user
      let thread = await Thread.findOne({
        threadId,
        owner: req.user._id,
      });

      if (!thread) {
        thread = new Thread({
          threadId,
          owner: req.user._id,
          title: cleanMessage
            ? cleanMessage.slice(0, 60)
            : "New Chat",
          messages: [],
        });
      }

      // Save attachment metadata (temporary upload)
      const uploadedAttachments = attachments.map((file) => ({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      }));

      // Save user message
      const userContent = cleanMessage || "Sent attachments";

      thread.messages.push({
        role: "user",
        content: userContent,
        attachments: uploadedAttachments,
      });

      thread.updatedAt = new Date();
      await thread.save();

      // Gemini receives original in-memory files
      const assistantReply = await getGeminiAPIResponse(
        cleanMessage,
        attachments
      );

      if (
        typeof assistantReply !== "string" ||
        !assistantReply.trim()
      ) {
        throw new Error("Empty response from Gemini.");
      }

      // Re-fetch owner-scoped thread before saving reply
      thread = await Thread.findOne({
        threadId,
        owner: req.user._id,
      });

      if (!thread) {
        return res.status(404).json({
          error: "Thread not found.",
        });
      }

      thread.messages.push({
        role: "assistant",
        content: assistantReply,
      });

      thread.updatedAt = new Date();
      await thread.save();

      res.json({
        reply: assistantReply,
      });
    } catch (error) {
      console.error("Chat error:", error);

      res.status(500).json({
        error: "Failed to process your message. Please try again.",
      });
    }
  }
);

export default router;
