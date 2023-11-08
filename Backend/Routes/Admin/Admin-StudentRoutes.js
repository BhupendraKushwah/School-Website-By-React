const express = require('express');
const router = express.Router();
const Admin = require('../Admin/Admin');
const students = require('../../models/Student')
const bodyParser = require('body-parser');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const Attendance = require('../../models/attendence')
const Feedback = require('../../models/Feedback')
const StudentMarks = require('../../models/Marks')
const UserAuthenticate = require('../../middleware/UserAuthentication');
const moment = require('moment-timezone');
const {body,validationResult}=require('express-validator')

const saltRounds = 10;

router.post('/addstudents',[
  body("Password", "Password Length should be more than 3").isLength({ min: 5 }),
  body("Name", "Name Length should be more than 3").isLength({ min: 3 }),
  body("Email", "Password Length should be more than 3").isEmail(),
  body("Role", "Role cannot be black").exists(),
  body("Class", "Class cannot be black").exists(),
  body("Gender", "Gender cannot be black").exists(),
  body("Enrollment", "Enrollment cannot be black").exists(),
  body("DOB", "DOB cannot be black").exists(),
  body("Guardians", "Guardians cannot be black").exists(),
  body("Contact", "Contact cannot be black").exists(),
  body("Address", "Address cannot be black").exists(),
  body("Fees","Fees cannot be black").exists(),
], UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const errors = validationResult(req)
            if(!errors.isEmpty()){
                return res.status(500).json(errors);
            }
            const user = await students.findOne({ Enrollment: req.body.Enrollment })
            if (user) { res.json({ msg: 'user already added', user: user }) }
            else {
                const { Password, ...rest } = req.body;
                const securePassword = await bcrypt.hash(Password, saltRounds)
                console.log(securePassword)
                const student = new students({ Password: securePassword, ...rest })
                student.save()
                res.send(student)
            }
        }
        catch (err) {
            res.send(err.message)
        }
    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})

router.put('/update-student/:_id', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const { ...rest } = req.body
            const { _id } = req.params
            let student = await students.findById(_id)
            if (student) {
                student.set({ ...rest })
                await student.save()
                res.json(student)
            }
            else {
                res.send('student updated successfully')
            }
        }
        catch (err) {
            res.send(`error updating student ${err.message}`)
        }
    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})

router.delete('/deleteStudent/:_id', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const student = await students.findById(req.params._id)
            if (student) {
                const user = await students.findByIdAndDelete(req.params._id)
                res.status(200).send({ message: "Student deleted successfully", user })
            }
            else {
                res.status(404).send({ message: "Student not found" })
            }
        } catch (error) {
            res.status(400).json({ message: error.message })
        }

    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})

router.get('/searchStudent', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const { ...rest } = req.query;
            const searchCriteria = {}
            Object.keys(rest).forEach((key) => {
                searchCriteria[key] = new RegExp(rest[key], 'i');
            })
            const student = await students.find({ $or: [searchCriteria] })
            console.log(student)
            if (student.length > 0) {
                res.send(student)
            }
            else {
                res.json({ message: "student not found" })
            }

        } catch (error) {
            res.send(error.message)
        }
    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})

router.post('/save-attendance', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const New = moment().tz('Asia/Kolkata').format().slice(0, 10); // 'Asia/Kolkata' is the timezone for IST
            const today= `${New}T00:00:00.000Z`
            
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
            res.status(500).json({ error: "An error occurred while processing the request."+error.message });
        }
    }
    else {
        res.status(403).json({ message: "Invalid Credentials" })
    }
})

router.get('/attendanceReport/:Class', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        const { Class } = req.params
        let query = { Class }

        try {
            const savedAttendance = await Attendance.find({'AttendanceByDate.Class': query.Class})

            if (savedAttendance.length>0) {

                res.status(200).json(savedAttendance);
            }
            else {

                res.status(400).send({ message: 'Attendance not found' })
            }
        } catch (error) {
            res.send(error.message)
        }
    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})

router.post('/record-marks', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const { Student, MarksByYear } = req.body
            const { StudentId } = Student[0]
            if (Student) {
                const User = await StudentMarks.findOne({ 'Student.StudentId': StudentId })
                console.log(User)
                if (User) {
                    existingMarksForYear = User.MarksByYear.find(mark => mark.Year === MarksByYear[0].Year);
                    if (existingMarksForYear) {
                        res.send('marks already registered')
                    }
                    else {
                        User.MarksByYear.push(MarksByYear[0])
                        User.save()
                        res.status(200).send(User)
                    }
                }
                else {
                    const newMarks = new StudentMarks({ Student, MarksByYear })
                    newMarks.save()
                    res.status(200).send(newMarks)
                }
            }
        }
        catch (error) {
            res.send(error.message)
        }
    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})

router.get('/get-marks/:Year/:StudentId?', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const Year = req.params.Year
            const StudentId = req.params.StudentId
            let query = { 'MarksByYear.Year': Year }
            if (StudentId) { query['Student.StudentId'] = StudentId }
            const Users = await StudentMarks.find(query, { 'Student': 1, 'MarksByYear.$': 1 });

            res.status(200).json(Users)
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})

router.get('/get-feedback', UserAuthenticate, async (req, res) => {
    if (req.user.Role === 'admin') {
        try {
            const feedback = await Feedback.find({});
           
            res.status(200).json(feedback)
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    else {
        res.json({ message: "Invalid Credentials" })
    }
})


module.exports = router;
