"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// ── Public routes (no auth) ──────────────────────────────────────────────────
// GET /api/tasks/groups - Home page directory of research groups
router.get('/groups', task_controller_1.getResearchGroups);
// GET /api/tasks/by-user/:userId - Participant chatbox tasks
// NOTE: Must be declared before /:id to avoid Express matching "by-user" as an id param
router.get('/by-user/:userId', task_controller_1.getTasksByUserId);
// ── Researcher routes (JWT required — scoped to the logged-in researcher) ────
// GET /api/tasks - Get all tasks for the authenticated researcher
router.get('/', auth_middleware_1.authenticate, task_controller_1.getAllTasks);
// GET /api/tasks/:id - Get a single task (must belong to the researcher)
router.get('/:id', auth_middleware_1.authenticate, task_controller_1.getTaskById);
// POST /api/tasks - Create a task for the authenticated researcher
router.post('/', auth_middleware_1.authenticate, task_controller_1.createTask);
// PUT /api/tasks/:id - Update a task
router.put('/:id', auth_middleware_1.authenticate, task_controller_1.updateTask);
// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', auth_middleware_1.authenticate, task_controller_1.deleteTask);
exports.default = router;
