const express = require('express')
const router = express.Router()
const gravatar = require('gravatar')
const { check, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')

const User = require('../../models/user')

// @route    POST api/users
// @desc     Register user
// @access   public

router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Please enter a pasword with 6 or more characters'
        ).isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        console.log(res.body)
        if (!errors.isEmpty()) {
            console.log('hi')
            return res.status(400).json({
                errors: errors.array(),
            })
        }

        const { name, email, password } = req.body

        try {
            // See if user exists
            let user = await User.findOne({ email })

            if (user) {
                return res.status(400).json({
                    errors: [{ msg: 'User already exists' }],
                })
            }

            // Get user gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm',
            })

            user = new User({
                name,
                email,
                avatar,
                password,
            })

            // Encrypt password
            const salt = await bcrypt.genSalt(10)

            user.password = await bcrypt.hash(password, salt)

            await user.save()

            // Return jsonwebtoken
        } catch (err) {
            console.log(err.message)
            res.status(500).send('Server error')
        }

        res.send('User Registered')
    }
)

module.exports = router
