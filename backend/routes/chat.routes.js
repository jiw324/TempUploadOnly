"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chat_controller_1 = require("../controllers/chat.controller");
const router = (0, express_1.Router)();
/**
 * POST /api/chat/message
 * Send a message and get AI response
 */
router.post('/message', chat_controller_1.sendMessage);
/**
 * POST /api/chat/stream
 * Send a message and stream AI response
 */
router.post('/stream', chat_controller_1.streamMessage);
exports.default = router;
