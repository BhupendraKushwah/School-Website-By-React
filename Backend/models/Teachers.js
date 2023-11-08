const mongoose = require('mongoose');
const { Schema } = mongoose;

const TeacherSchema = new Schema({
    Username: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Role: {
        type: String,
        default: 'teacher'
    },
    ClassTeacher:{
        type: String,  
    },
    Classes: [
        {
            subject: { type: String, required: true },
            class: { type: String, required: true },
        },
    ],
    Gender: {
        type: String,
        required: true
    },
    resetToken: {
        type:String
    },
    resetTokenExpiration: {
        type:Date
    },
    Contact:{
        type:Number,
        required: true
    },
    Address:{
        type:String,
        required: true
    }
})

const Teacher = mongoose.model('Teacher', TeacherSchema)
module.exports = Teacher;