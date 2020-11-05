const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const User = require('../../models/user')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')

// @route    GET api/auth
// @desc     Test route
// @access   public

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

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

            // Create user
            user = new User({
                name,
                email,
                avatar,
                password,
            })

            // Encrypt the user password
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password, salt)

            // Save the user
            await user.save()

            // Create the payload (user id for jsonwebtoken)
            const payload = {
                user: {
                    id: user.id,
                },
            }

            // Sign the token, passing the payload
            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err
                    res.json(token)
                }
            )

            // Return jsonwebtoken
        } catch (err) {
            console.log(err.message)
            res.status(500).send('Server error')
        }
    }
)

module.exports = router
