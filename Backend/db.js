const mongoose = require('mongoose');
const password=encodeURI("Bhupendra2003")
const activateMongo=async()=>{
    await mongoose.connect(`mongodb+srv://bhupendrakushwah977:${password}@cluster0.m0nuv5k.mongodb.net/school?retryWrites=true&w=majority`, {
        ssl: true}).then(()=>{
        console.log('mongodb connection established')
    })
    
    
}
module.exports = activateMongo;
