const mongoose=require('mongoose');
const {Schema}=mongoose;

const StudentSchema=new Schema({
    Image:{
        type:String,
        required:false,
    },
   Enrollment:{
        type:String,
        required:true
    },
    Password:{
        type:String,
        required:true
    },
    Name:{
        type:String,
        required:true
    },
    Email:{
        type:String,
        required:true
    },
    Role:{
        type:String,
        default:'student'
    },
    Class:{
        type:String,
        required:true
    },
    Gender:{
        type:String,
        required:true
    },
    EnrollmentDate:{
        type:Date,
        default: Date.now
    },
    DOB:{
        type:Date,
        required:true
    },
    Guardians:{
        type:String,
        required:true
    },
    Contact:{
        type:String,
        required:true
    },
    Address:{
        type:String,
        required:true
    },
    Fees:{
        type:String,
        required:true
    },
    FeesSubmit:{
        type:String,
        required:true,
        default:'00'
    }

})

const student = mongoose.model('student',StudentSchema)
module.exports=student;