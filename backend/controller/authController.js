const User = require('../models/User')
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// generate jwt token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" })
};

//@desc Register a new user
//@route POST /api/auth/register
//@access Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, profileImageUrl, adminInviteToken } = req.body

        //check if the user already exist
        const userExist = await User.findOne({ email })
        if (userExist) {
            return res.status(400).json({ message: "User already exists" })
        }

        //Dertermine user role Admin if access token is provided, otherwise member
        let role = "member";
        if (adminInviteToken && adminInviteToken == process.env.ADMIN_INVITE_TOKEN) {
            role = "admin"
        }

        //hashpassword
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        //create new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profileImageUrl,
            role
        })

        //return user data with jwt
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            token: generateToken(user._id)

        })

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message })
    }

}

//@desc Login  user
//@route POST /api/auth/login
//@access Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(401).json({ message: "invalid email or password" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({ message: "invalid email or password" })
        }
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profileImageUrl,
            token: generateToken(user._id)
        })

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}

//@desc Get user profile
//@route GET /api/auth/profile
//@access private (Require JWT)
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password")
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.json(user)

    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message })
    }
}

//@desc Update user profile
//@route PUT /api/auth/profile
//@access private (Require JWT)
const updateUserProfile = async (req, res) => {

    const user = await User.findById(req.user.id)
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    user.name = req.body.name || user.name
    user.email = req.body.email || user.email

    if (req.body.password) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(req.body.password, salt)
    }

    const updateUser = await user.save()

    if(updatedUser){
        res().json(
            {
                _id:updateUser._id,
                name:updateUser.name,
                email:updateUser.email,
                role:updateUser.role,
                token:generateToken(updateUser._id),
            
            }
        )
    }

}

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile }
