const mongoose = require("mongoose");

const mongooseSchema = mongoose.Schema(
    {
        email: { type: String },
        examId: { type: String },
        sessionId: { type: String },
        courseId: { type: String },
        courseName: { type: String },
        videoPath: { type: String },
        marks: { type: Number },
        headlessHash: { type: String },
        clientHash: { type: String },
        status: { type: String, enum: ["pass", "fail"] }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("examSession", mongooseSchema);
