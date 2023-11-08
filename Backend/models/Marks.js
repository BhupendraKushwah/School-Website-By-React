const mongoose = require('mongoose');
const { Schema } = mongoose;

const MarksSchema = new Schema({
    Student: [
        {
            StudentId: { type: Schema.Types.ObjectId, required: true },
            StudentName: { type: Schema.Types.String, required: true }
        }
    ],
    MarksByYear: [
        {
            Year: { type: Schema.Types.String, required: true },
            SubjectMarks: [
                {
                    subject: { type: String, required: true },
                    Marks: { type: Schema.Types.Number, required: true },
                },
            ],
            ExamName: {
                type: Schema.Types.String,
                required: true
            },
            Result: {
                type: Schema.Types.String,
                required: true
            }
        }
    ]
})

const RecordMarks = mongoose.model('RecordMarks', MarksSchema)
module.exports = RecordMarks