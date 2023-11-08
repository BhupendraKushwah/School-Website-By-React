const mongoose = require('mongoose')
const {Schema}=mongoose;
const AdminSchema = new Schema({
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
        default: 'admin',
        type: String,
        
    },
    
});

const Admin = mongoose.model('admin', AdminSchema);
Admin.createIndexes(Admin.Email);
module.exports = Admin;