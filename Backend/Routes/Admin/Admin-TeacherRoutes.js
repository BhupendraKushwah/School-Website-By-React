const express = require('express');
const router = express.Router();
const Admin = require('./Admin');
const teachers = require('../../models/Teachers')
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const TeacherAttendance = require('../../models/TeacherAttendance');
const UserAuthenticate = require('../../middleware/UserAuthentication');
const moment = require('moment-timezone');
const {body,validationResult} = require('express-validator');
const saltRounds = 10;

router.post('/forgot-password', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        const { usermail } = req.body
        const token = crypto.randomBytes(16).toString('hex');
        console.log(token)
        const expirationTime = new Date(Date.now() + 3600000)
        const user = await teachers.findOne({ Email: usermail })
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.resetToken = token;
        user.resetTokenExpiration = expirationTime;
        await user.save()
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "bhupendrakushwah977@gmail.com",
                pass: "ubvx mbfr wdxm oybh",
            },
        });
        const mailOptions = {
            from: 'bhupendrakushwah977@gmail.com',
            to: usermail,
            subject: 'Password Reset Request',
            text: `To reset your password, click the following link: http://localhost:3000/admin/reset-password/${token}`,
        }
        transporter.sendMail(mailOptions, (error, info) => {
            console.log(mailOptions)
            if (error) {
                console.log('Error sending email: ' + error);
                res.status(500).json({ success: false, message: 'Error sending email' });
            } else {
                console.log('Email sent: ' + info.response);
                res.status(200).json({ success: true, message: 'Password reset instructions sent to your email' });
            }
        })
    }
    catch (error) {
        res.status(500).json({ message: "Error processing request", error: error.message });
    }
})

router.get('/reset-password/:token', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ message: "Token is missing in the request" });
        }
        res.send(`Password reset form for token: ${token}`);
    }
    catch (error) {
        res.status(500).json({ message: 'An error occurred while resetting the password' });
    }
});

router.post('/reset-password/:token', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        const { token } = req.params;
        const { password, cpassword } = req.body

        const user = await teachers.findOne({ resetToken: token });
        if (!user) {
            return res.status(404).json({ message: "Token not found or expired" });
        }
        if (user.resetTokenExpiration <= new Date()) {
            user.resetToken = undefined;
            user.resetTokenExpiration = undefined;
            await user.save();
            return res.status(400).json({ message: "Token expired" });
        }
        if (password !== cpassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        user.Password = cpassword;
        user.resetTokenExpiration = undefined;
        user.resetToken = undefined;
        await user.save()
        return res.status(200).json({ message: "Password reset successfully" });

    }
    catch (error) {
        res.status(500).json({ message: 'Error resetting password', error: error.message });
    }
})


// router.post('/findteacher', UserAuthenticate, async (req, res) => {
//     if (req.user.Role !== 'admin') {
//         return res.status(403).json({ message: "Invalid role: Access denied" });
//     }

//     try {
//         const classNameToFind = 'Class 6'; // Replace with the class you want to find
//         teachers.find({ 'Classes.class': classNameToFind })
//             .then((results) => {
//                 if (results.length > 0) {
//                     const response = results.map((result) => ({
//                         teacherName: result.Name,
//                         subject: result.Classes.find((cls) => cls.class === classNameToFind).subject,
//                     }));
//                     res.json(response);
//                 } else {
//                     res.json({ message: `No teacher found for class ${classNameToFind}.` });
//                 }
//             })
//             .catch((err) => {
//                 res.status(500).json({ error: error.message });
//             });
//     }
//     catch (error) {
//         res.status(500).json({ message: 'Error adding teacher', error: error.message });
//     }
// })

router.post('/add-teacher',[
    body("password", "Password Length should be more than 3").isLength({ min: 3 }),
    body("name", "Name Length should be more than 3").isLength({ min: 3 }),
    body("email", "Password Length should be more than 3").isEmail(),
    body("role", "Role cannot be black").exists(),
    body("classes", "Class cannot be black").exists(),
    body("gender", "Gender cannot be black").exists(),
    body("username", "username cannot be black").exists(),
    body("contact", "Contact cannot be black").exists(),
    body("address", "Address cannot be black").exists(),
  ], UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        const errors=validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(403).json(errors);
        }
        const { username, password, name, email, role, classes, gender, contact, address } = req.body;
        const teacherExist = await teachers.findOne({ Username: username })
        if (teacherExist) {
            return res.status(403).json({ message: 'Username already exists' });
        }
        const securepassword = await bcrypt.hash(password, saltRounds)
        const teacherassignment = new teachers({
            Username: username,
            Password: securepassword,
            Name: name,
            Email: email,
            Role: role,
            Classes: classes,
            Gender: gender,
            Contact: contact,
            Address: address
        })
        await teacherassignment.save()
        res.status(201).send(teacherassignment)
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding teacher', error: error.message });
    }
})

router.delete('/deleteTeacher/:id', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }
    try {
        let user = await teachers.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ error: `Teacher not found` })
        }
        res.json({ "success": "Teacher successfully deleted", "notes": user })

    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting  teacher', error: error.message });
    }
})

router.post('/fetch-teachers', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        const teacher = await teachers.find({}).select('-Password');
        res.json(teacher)
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding teacher', error: error.message });
    }
})

router.put('/update-teacher/:id', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        const { ...rest } = req.body;
        const teacher = await teachers.findById(req.params.id)
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found" });
        }
        if (teacher) {
            console.log(req.user.Role, teacher.id, req.user.id)
            // Validate the user role to ensure a teacher is updating their own profile
            if (req.user.Role === 'teacher' && req.user.id !== teacher.id) {
                return res.status(403).json({ message: "Unauthorized to update this profile" });
            }
            teacher.set({ ...rest })
            const user = await teacher.save();
            return res.json(user)
        } else {
            res.status(404).json({ message: "Teacher not found" });
        }

    }
    catch (error) {
        res.status(500).json({ message: 'Error adding teacher', error: error.message });
    }
})

// search and filter 
router.get('/search-teacher', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        const { Name } = req.query;
        if (!Name) {
            return res.status(400).json({ message: 'Please provide a search query' });
        }
        const teacher = await teachers.findOne({ Name: { $regex: Name, $options: 'i' } })
        if (teacher) {
            return res.status(200).json({ teacher })
        }
        else {
            res.status(404).json({ message: 'Teacher not found' });
        }

    }
    catch (error) {
        res.status(500).json({ message: 'Error adding teacher', error: error.message });
    }
})

router.post('/TeacherRegisterAttendee', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }

    try {
        let { TeacherAttendee } = req.body
        const New = moment().tz('Asia/Kolkata').format().slice(0, 10); // 'Asia/Kolkata' is the timezone for IST
        const today = `${New}T00:00:00.000Z`
        for (const data of TeacherAttendee) {
            let teacher = await TeacherAttendance.findOne({
                'TeacherId': data.TeacherId
            });
            if (teacher) {

                const isDateMatch = teacher.AttendanceByDate.some(date => {
                    console.log(New)
                    return date.Date.toISOString().slice(0, 10) === New
                })
                if (!isDateMatch) {
                    teacher.AttendanceByDate.push({
                        Date: today,
                        Status: data.Status,
                        Class: data.Class
                    })
                    await teacher.save();
                }
            }
            else {

                const newTeacher = new TeacherAttendance({
                    TeacherId: data.TeacherId,
                    AttendanceByDate: [
                        {
                            Date: today,
                            Status: data.Status,
                            Class: data.Class
                        }
                    ]
                })
                await newTeacher.save()
            }
        }
        res.status(200).json({ message: "Attendance recorded successfully." });
    }
    catch (error) {
        res.status(500).json({ message: 'Error adding teacher', error: error.message });
    }
})

router.get('/TeacherAttendanceReport/:Date/:TeacherId?', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'admin') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }


    try {
        let { Date, TeacherId } = req.params
        Date = `${Date}T00:00:00.000Z`
        let query = { 'AttendanceByDate.Date': Date }
        if (TeacherId) { query.TeacherId = TeacherId }
        const result = await TeacherAttendance.find(query)
        if (result && result.length > 0) {
            return res.status(200).json(result);
        } else {
            return res.status(404).json({ message: 'No records found for the specified date and teacher' });
        }
        
    }
    catch (error) {
        res.status(500).json({ message: 'Error Fetching Teacher Attendance', error: error.message });
    }
})

module.exports = router