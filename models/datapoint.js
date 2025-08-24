const mongoose = require("mongoose");

const TranscriptSchema = new mongoose.Schema(
  {
    speaker: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    age: {
      type: String,
      required: true,
    },
    startTime: {
      type: Number,
      required: true,
    },
    endTime: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    emotion: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

const AudioDatapoint = new mongoose.Schema(
  {
    processingStatus: {
      type: String,
      enum: [
        "created",
        "pre-label",
        "live-label-mcq",
        "live-label-txt",
        "consensus",
        "completed",
      ],
      default: "created",
    },
    mediaUrl: { type: String, required: true },
    project_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    transcripts: {
      type: [TranscriptSchema],
      default:[],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model( "audioDatapoint", AudioDatapoint, "audioDatapoints" );
