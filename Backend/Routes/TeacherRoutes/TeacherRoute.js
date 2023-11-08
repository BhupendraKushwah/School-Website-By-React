const express = require('express')
const router = express.Router()
const Teachers = require('../../models/Teachers')
const TeachersAttendance = require('../../models/TeacherAttendance')
const Students = require('../../models/Student')
const Attendance = require('../../models/attendence')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserAuthenticate = require('../../middleware/UserAuthentication')
const moment = require('moment-timezone');
const { body, validationResult } = require('express-validator');


// Login routes for Teachers 
router.post('/Login-teachers',[
    body('Username', 'Username cannot be blank').exists(),
    body('Password', 'Password cannot be blank').exists(),
], async (req, res) => {
    try {
        const errors= validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: "Invalid Credentials" });
        }
        const { Username, Password } = req.body
        const teacher = await Teachers.findOne({ Username })
        const comparePassword = await bcrypt.compare(Password, teacher.Password)
        if (comparePassword) {
            const data = {
                id: teacher.id,
                Role: teacher.Role
            }
            const Token = jwt.sign(data, process.env.JWT_SECRET_KEY)
            res.json(Token)
        }
        else {
            res.status(403).send({ message: "Invalid credentials" })
        }
    }
    catch (err) {
        res.send(err.message)
    }


})

//fetch details from server
router.get('/Profile', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'teacher') {
        try {
            const user = await Teachers.findById(req.user.id).select('-Password');
            res.send(user);
        }
        catch (e) {
            res.json(e.message)
        }
    }
    else {
        res.json({ error: 'Authentication error' })
    }
})

//fetch students from server 
router.get('/:id/Students-Report', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'teacher') {
        try {
            console.log('teacher')
            const teacher = await Teachers.findById(req.params.id)
            const allStudents = {};
            const classTeacher = teacher.ClassTeacher
            const studentsOfClass = await Students.find({ Class: classTeacher }).select('-Password');
            if(studentsOfClass.length<=0){
                return res.status(404).json({message:'Students Not Found'})
            }
            
            console.log(studentsOfClass.length)
            res.send(studentsOfClass)
        } catch (error) {
            res.json(error.message)
        }
    }
    else {
        res.json({ error: 'Authentication error' })
    }

})

// Route to get details of a specific student
router.get('/:teacherId/student/:studentId', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'teacher') {
        try {
            const { studentId } = req.params
            const student = await Students.findById(studentId).select('-Password');
            if(!student){
                return res.status(404).send('Student not found')
            }
            res.json(student)
        } catch (error) {
            res.json(error.message)
        }
    }
    else {
        res.json({ error: 'Authentication error' })
    }

})


// Route to get Own Attendance 
router.get('/:teacherId/Attendance-Report', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'teacher') {
        try {
            const { teacherId } = req.params
            const student = await TeachersAttendance.findOne({TeacherId:teacherId});
            res.json(student)
        } catch (error) {
            res.json(error.message)
        }
    }
    else {
        res.json({ error: 'Authentication error' })
    }

})

router.put('/:id/details', UserAuthenticate, async (req, res) => {
    try {
        const { ...rest } = req.body;
        const teacherId = req.params.id

        if (req.user.Role !== 'teacher') {
            return res.status(403).json({ message: 'Forbidden. Access allowed for teachers only.' })
        }

        if (req.user.id !== teacherId) {
            return res.status(401).json({ message: "Unauthorized. Please log with correct Credentials." })
        }

        let updatedTeacher = await Teachers.findOneAndUpdate({ '_id': teacherId }, rest, { new: true });

        if (!updatedTeacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        res.json(updatedTeacher)
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

})

router.post('/:id/record-attendance', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'teacher') {
        try {
            const New = moment().tz('Asia/Kolkata').format().slice(0, 10); // 'Asia/Kolkata' is the timezone for IST
            const today = `${New}T00:00:00.000Z`
            let { studentsAttendance } = req.body
            for (const data of studentsAttendance) {
                const student = await Attendance.findOne({ 'StudentId': data.StudentId })
                if (student) {
                    const isDateMatch = student.AttendanceByDate.some(date =>
                        date.Date.toISOString().slice(0, 10) === New
                    )
                    if (!isDateMatch) {

                        student.AttendanceByDate.push({
                            Date: today,
                            Status: data.Status,
                            Class: data.Class
                        })
                        await student.save();
                    }

                }
                else {
                    const newStudent = new Attendance({
                        StudentId: data.StudentId,
                        AttendanceByDate: [
                            {
                                Date: today,
                                Status: data.Status,
                                Class: data.Class
                            }
                        ]
                    })
                    await newStudent.save()
                }
            }
            res.status(200).json({ message: "Attendance recorded successfully." });
        }
        catch (error) {
            res.status(500).json({ error: "An error occurred while processing the request." + error.message });
        }
    }
    else {
        res.status(403).json({ message: "Invalid Credentials" })
    }
})
module.exports = router