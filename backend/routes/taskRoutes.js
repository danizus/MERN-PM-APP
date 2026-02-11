const express = require("express")
const { protect, adminOnly } = require("../middlewares/authMiddleware")
const { getDashboardData, getUserDashboardData, getTasks, getTaskById, createtask, updateTask, deleteTask, updateTaskStatus, updateTaskChecklist } = require("../controller/taskController")

const router = express.Router()

router.get('/dashboard-data', protect, getDashboardData)
router.get('/userDashboardData', protect, getUserDashboardData)
router.get('/', protect, getTasks) //get all tasks (admin:all user:assigned)
router.get('/:id', protect, getTaskById) //get task details
router.post('/', protect, createtask)
router.put('/:id', protect, updateTask)
router.delete('/:id', protect, deleteTask) //only admin
router.put('/:id/status', protect, updateTaskStatus) //update task status
router.put('/:id/todo', protect, updateTaskChecklist) //update task checklist


module.exports = router;