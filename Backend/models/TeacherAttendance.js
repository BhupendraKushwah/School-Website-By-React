const mongoose = require('mongoose');
const { Schema } = mongoose
const Teacher = require('./Teachers');

const TeacherAttendanceSchema = new Schema({
    TeacherId: {
        type: Schema.Types.ObjectId,
        ref: 'Teacher'
    },
    AttendanceByDate: [{
        Date: {
            type: Date,
            required: true,
            default: new Date
        },
        Status: {
            type: String,
            required: true
        },
    }]
})
const TeacherAttendance = mongoose.model('TeacherAttendance', TeacherAttendanceSchema);
module.exports = TeacherAttendance;