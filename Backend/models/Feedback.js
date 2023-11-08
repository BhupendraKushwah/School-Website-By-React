const mongoose = require('mongoose');
const { Schema } = mongoose;
const Student = require('./Student')

const FeedbackSchema = new Schema({
    UserId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Student'
    },
    DescriptionOfFeedback: {
        type: String,
        required: true,
    },
    Class: {
        type: Number,
        required: true,
    },
    Time: {
        type: Date,
        default: Date.now(),
    }
})

const Feedback = mongoose.model('Feedback', FeedbackSchema)
module.exports = Feedback