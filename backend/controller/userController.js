
const Task = require("../models/Task")
const Users = require("../models/User")
const bcrypt = require("bcryptjs")

//@desc get all users
//@route GET /api/users/ 
//access private(admin)

const getUsers = async(req, res) => {
    try {
        const user = await Users.find({ role: "member" }).select("-password")
        const userWithTaskCount = await Promise.all(
            user.map(async (user) => {
                const pendingTasks = await Task.countDocuments({ assignedTo: user._id, status: "Pending" });
                const inProgressTasks = await Task.countDocuments({ assignedTo: user._id, status: "In Progress" });
                const completedTasks = await Task.countDocuments({ assignedTo: user._id, status: "Completed" });

                return {
                    ...user._doc,
                    pendingTasks,
                    inProgressTasks,
                    completedTasks
                }
            })
        )

        res.json(userWithTaskCount)

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })

    }
}

//@desc get user by id
//@route GET /api/user/:id
//@access private

const getUserById = async (req, res) => {
    try {
        
        const user = await  Users.findById(req.params.id).select("-password")
        if(!user) return res.status(404).json({message:"User not found"})

        res.json(user)


    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })

    }
}

//@desc delete user 
//@route DELETE /api/user/:id
//@access private (ADMIN)

const deleteUser = (req, res) => {
    try {

    } catch (error) {
        res.status(500).json({ message: "server error", error: error.message })

    }
}

module.exports = { getUsers, getUserById, deleteUser }