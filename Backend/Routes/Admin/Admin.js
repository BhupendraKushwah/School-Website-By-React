const express = require('express');
const router = express.Router();
const Admin = require('../../models/admin');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const Admin_Teacher = require('./Admin-TeacherRoutes')
const Admin_Student = require('./Admin-StudentRoutes')
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();



router.post('/login', [
    body("Username", "Username cannot be black").exists(),
    body("Password", "Password cannot be black").exists(),
], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(403).json(errors);
    }
    const { Username, Password } = req.body
    const admin = await Admin.findOne({ Username: Username })
    console.log(admin.Role)
    if (admin) {
        const newPassword = await bcrypt.compare(Password, admin.Password)
        if (newPassword) {
            const data = {
                id: admin.id,
                Role: admin.Role
            }
            const Auth_token = jwt.sign(data, process.env.JWT_SECRET_KEY)
            res.json(Auth_token)
        }
        else {
            res.status(404).send(`user not found`)
        }
    }
    else {
        res.status(404).send(`User not found with username ${Username}`)

    }
})

router.post('/registration', [
    body("Username", "Username cannot be black").exists(),
    body("Name", "Name Length should be more than 3").isLength({ min: 3 }),
    body("Password", "Password Length should be more than 3").isLength({ min: 5 }),
    body("Cpassword", "Confirm Password Length should be more than 3").isLength({ min: 5 }),
    body("Email", "Password Length should be more than 3").isEmail(),
    body("Role", "Role cannot be black").exists(),
], async (req, res) => {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(403).json({ errors })
        }
        const { Cpassword, Password, ...rest } = req.body;

        let salt = bcrypt.genSaltSync(10);

        if (Password == Cpassword) {

            const user = await Admin.findOne();
            if (user) {
                res.status(400).send('Admin already registered')
            }
            else {
                const securepassword = await bcrypt.hash(Password, salt)

                let admin = new Admin({ ...rest, Password: securepassword })
                const data = {
                    user: admin.id,
                    Role: admin.Role
                }
                console.log(process.env.JWT_SECRET_KEY)
                const Auth_token = jwt.sign(data, process.env.JWT_SECRET_KEY)
                admin.save()
                res.json(Auth_token)
            }
        }
        else {
            res.status(500).json({ error: 'An error occurred during registration' })

        }
    } catch (error) {
        res.status(500).json({ error })
    }
})

router.use('/teacher', Admin_Teacher)

router.use('/Students', Admin_Student)

module.exports = router