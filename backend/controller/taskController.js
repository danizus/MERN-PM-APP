const Task = require("../models/Task")
const Users = require("../models/User")
const bcrypt = require("bcryptjs")

//@desc Get all task admin:all user:only assigned tasks
//route GET /api/tasks/
//@access Private

const getTasks = async (req, res) => {
    try {
        const { status } = req.query

        let filter = {};
        if (status) {
            filter.status = status
        }

        let tasks;

        if (req.user.role === "admin") {
            tasks = await Task.find(filter).populate(
                "assignedTo",
                "name email profileImageUrl"
            )
        } else {
            tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
                "assignedTo",
                "name email profileImageUrl"
            )
        }

        //add complete todo checklist count to each task

        task = await Promise.all(
            tasks.map(async (task) => {
                const completedCount = task.todoChecklist.filter(item => item.completed).length
                return { ...task._doc, completedTodoCount: completedCount }

            }))

        const allTasks = await Task.countDocuments(
            req.user.role === "admin" ? {} : { assignedTo: req.user._id }
        )

        const pendingTasks = await Task.countDocuments(
            {
                ...filter,
                status: "Pending",
                ...(req.user.role !== "admin" && { assignedTo: req.user._id })
            }
        )

        const inProgressTasks = await Task.countDocuments(
            {
                ...filter,
                status: "In Progress",
                ...(req.user.role !== "admin" && { assignedTo: req.user._id })
            }
        )

        const completedTasks = await Task.countDocuments(
            {
                ...filter,
                status: "Completed",
                ...(req.user.role !== "admin" && { assignedTo: req.user._id })
            }
        )

        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks
            }
        });

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc Get task by Id
//route GET /api/tasks/:id
//@access Private

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        )

        if (!task) return res.status(404).json({ message: "Task not found" })

        res.json(task)

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc Create a new task (admin only)
//route POST /api/tasks/
//@access Private (Admin only)

const createtask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist
        } = req.body

        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: "assignedTo must be an array of user ids" })
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
            createdBy: req.user._id
        })

        res.status(201).json({ message: "Task created succesfully", task })

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc Update task
//route PUT /api/tasks/:id
//@access Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: "Task not found" })

        task.title = req.body.title || task.title
        task.description = req.body.description || task.description
        task.priority = req.body.priority || task.priority
        task.dueDate = req.body.dueDate || task.dueDate
        task.attachments = req.body.attachments || task.attachments
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist


        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: "assignedTo must be an array of user IDs" })
            }
            Task.asssignedTo = req.body.assignedTo
        }

        const updatedTask = await task.save();
        res.json({
            message: "Task updated successfully",
            updatedTask
        })

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc Delete task
//route DELETE /api/tasks/:id
//@access Private (Admin only)

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: "Task not found" })
        await task.deleteOne();

        res.json({ message: "Task deleted successfully" })

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc update task status
//route DELETE /api/tasks/:id/status
//@access Private 

const updateTaskStatus = async (req, res) => {
    try {

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" })

        const isAssigned = task.assignedTo.some((userId) => userId.toString() === req.user._id.toString())

        if (!isAssigned && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not Authorized" })
        }

        task.status = req.body.status || task.status

        if (task.status === "Completed") {
            task.todoChecklist.forEach(item => item.completed = true)
            task.progress = 100;
        }

        await task.save()
        res.json({ message: "Task status updated", task })

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc update task Check list 
//route put /api/tasks/:id/todo
//@access Private 

const updateTaskChecklist = async (req, res) => {
    try {
        const { todoChecklist } = req.body;
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" })

        if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not Authorized" })
        }

        task.todoChecklist = todoChecklist;
        const completedCount = task.todoChecklist.filter((item) => item.completed).length
        const totalItems = task.todoChecklist.length
        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

        if (task.progress === 100) {
            task.status = "Completed";
        } else if (task.progress > 0) {
            task.status = "In Progress"
        } else {
            task.status = "Pending"
        }

        await task.save()
        const updatedTask = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
        );

        res.json({ message: "Task checklist updated successfully", updatedTask })

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc Dasboard Data (admin only)
//route put /api/tasks/dashboard-data
//@access Private   

const getDashboardData = async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: "Pending" })
        const completedTasks = await Task.countDocuments({ status: "Completed" })

        const overDueTasks = await Task.countDocuments({
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() }
        })

        //Ensure all possible statuses are included
        const taskStatuses = ["Pending", "In Progress", "Completed"]
        const taskDistributionRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ])

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0
            return acc;
        }, {})


        taskDistribution["All"] = totalTasks
        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            {
                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                }
            }
        ])

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0
            return acc
        }, {})

        //Fetch recent 10 tasks

        const recentTasks = await Task.find().sort({ createdAt: -1 }).limit(10).select("title status priority dueDate createdAt")

        res.status(200).json(
            {
                statistics: {
                    totalTasks,
                    pendingTasks,
                    completedTasks,
                    overDueTasks
                },
                charts: {
                    taskDistribution,
                    taskPriorityLevels
                },
                recentTasks
            }
        )

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}

//@desc Dasboard Data (user specific)
//route put /api/tasks/user-dashboard-data
//@access Private


const getUserDashboardData = async (req, res) => {
    try {

        const userId = req.user._id

        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const pendingTasks = await Task.countDocuments({ status: "Pending", assignedTo: userId })
        const completedTasks = await Task.countDocuments({ status: "Completed", assignedTo: userId })

        const overDueTasks = await Task.countDocuments({
            status: { $ne: "Completed" },
            dueDate: { $lt: new Date() },
            assignedTo: userId
        })

        //Ensure all possible statuses are included
        const taskStatuses = ["Pending", "In Progress", "Completed"]
        const taskDistributionRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ])

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/\s+/g, "");
            acc[formattedKey] = taskDistributionRaw.find((item) => item._id === status)?.count || 0
            return acc;
        }, {})
        taskDistribution["All"] = totalTasks

        const taskPriorities = ["Low", "Medium", "High"];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            {

                $group: {
                    _id: "$priority",
                    count: { $sum: 1 },
                }
            }
        ])

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0
            return acc
        }, {})

        //Fetch recent 10 tasks

        const recentTasks = await Task.find({ assignedTo: userId }).sort({ createdAt: -1 }).limit(10).select("title status priority dueDate createdAt")

        res.status(200).json(
            {
                statistics: {
                    totalTasks,
                    pendingTasks,
                    completedTasks,
                    overDueTasks
                },
                charts: {
                    taskDistribution,
                    taskPriorityLevels
                },
                recentTasks
            }
        )

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })
    }
}


module.exports = {
    getUserDashboardData,
    getDashboardData,
    updateTaskChecklist,
    updateTask,
    createtask,
    getTaskById,
    getTasks,
    deleteTask,
    updateTaskStatus

}