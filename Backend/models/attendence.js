const mongoose = require('mongoose');
const { Schema } = mongoose
const Student = require('./Student');

const AttendanceSchema = new Schema({
    StudentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student'
    },
    AttendanceByDate: [{
        Date: {
            type: Date,
            required: true
        },
        Status: {
            type: String,
            required: true
        },
        Class: {
            type: String,
            required: true
        }
    }]
})
const Attendance = mongoose.model('Attendance', AttendanceSchema)
module.exports = Attendance;