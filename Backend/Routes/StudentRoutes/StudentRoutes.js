const express = require('express');
const router = express.Router();
const Students = require('../../models/Student');
const Teachers = require('../../models/Teachers') //For class schedules
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserAuthenticate = require('../../middleware/UserAuthentication')
const StudentsAttendee = require('../../models/attendence');
const { body, validationResult } = require('express-validator');
const StudentMarks = require('../../models/Marks');
const Feedbacks= require('../../models/Feedback');
const moment = require('moment-timezone');


router.post('/login',[
    body('Enrollment','Enrollment cannot be blank').exists(),
    body('Password', 'Password cannot be blank').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            return res.status(500).json(errors);
        }
        const { Enrollment, Password } = req.body;
        const student = await Students.findOne({ Enrollment })
        if (!student) {
            return res.status(404).json({ message: 'Student not found' })
        }
        const validPassword = await bcrypt.compare(Password, student.Password)
        if (!validPassword) {
            res.status(401).json({ message: 'Invalid username or password' });
        }
        const data = {
            id: student.id,
            Role: student.Role
        }
        const token = jwt.sign(data, process.env.JWT_SECRET_KEY)
        res.status(200).json(token);
    }
    catch (err) {
        res.status(500).json(err.message)
    }
})

// fetch the student details from the server
router.get('/:id/profile', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'student') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }
    try {
        const studentId = req.params.id;
        const studentProfile = await Students.findById(studentId).select('-Password');
        if (!studentProfile) {
            return res.status(404).json({ message: "Student not found" });
        }
        res.json(studentProfile);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student profile', error: error.message });
    }
})

//fetch student Class Schedule from teachers database using class
router.get('/:id/class/schedule/:class', UserAuthenticate, async (req, res) => {
    if (req.user.Role !== 'student') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }
    try {
        const StudentClass=req.params.class
        console.log(StudentClass)
        const teachers = await Teachers.find({'Classes.class':StudentClass},{'_id':0, 'Name': 1, 'Classes.$': 1 })
        if(teachers.length === 0){
            res.status(404).json({ message: "No Classes found" });
        }
        let Class= teachers.map(teacher=>{
            Name=teacher.Name
            const Scheduledclass = teacher.Classes.map(singleClass =>{
                 return singleClass.subject
            })
            return {Name, Scheduledclass}
        })

        res.send(Class)

    } catch (error) {
        res.status(500).json({ message: 'Error fetching student profile', error: error.message });
    }
})

// fetch Student Attendance from Attendance  Collection
router.get('/:id/Attendance',UserAuthenticate,async (req, res)=>{
    if (req.user.Role !== 'student') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }
    try {
        const StudentId=req.params.id;
        const attendance = await StudentsAttendee.findOne({StudentId});
        if(!attendance){
            return res.status(404).json({ message: "No Attendance found"})
        }
        res.json(attendance)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student profile', error: error.message });
    }
})

// fetch Report card Or marks 
router.get('/:id/academic-results',UserAuthenticate,async (req, res)=>{
    if (req.user.Role !== 'student') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }
    try {
        const StudentId=req.params.id;
        const marks = await StudentMarks.findOne({'Student.StudentId':StudentId}).select('-Student.StudentId');
        if(!marks){
            return res.status(404).json({ message: "No academic-results found"})
        }
        res.json(marks)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student profile', error: error.message });
    }
})

//Send the feedback to the Admin
router.post('/:id/feedback',UserAuthenticate,[
    body('DescriptionOfFeedback','Description cannot be blank').exists()
],async (req, res)=>{
    if (req.user.Role !== 'student') {
        return res.status(403).json({ message: "Invalid role: Access denied" });
    }
    try {
        const errors = validationResult(req);
        console.log(errors);
        if(!errors.isEmpty()){
            return res.status(500).json(errors)
        }
        const today = moment().tz('Asia/Kolkata').format(); 
        const {UserId,DescriptionOfFeedback,Class}=req.body;
        const lastFeedback = await Feedbacks.findOne({ UserId }).sort({ Time: -1 });

    if (lastFeedback) {
      const currentTime = new Date();
      const timeDiff =  currentTime-lastFeedback.Time;
      const minutesPassed = Math.abs(timeDiff / 1000)  // Convert milliseconds to seconds
      if (minutesPassed < 120) {
        return res.status(400).json({ message: "Please wait at least 2 minutes before submitting feedback again.", minutesPassed});
      }
    }
        const newFeedback = new Feedbacks({
            UserId,
            DescriptionOfFeedback,
            Class,
            Time:today,
        })
        const savedFeedback = await newFeedback.save();
        res.status(200).json(savedFeedback)
    } catch (error) {
        res.status(500).json({ message: 'Error fetching student profile', error: error.message });
    }
})


module.exports = router;
