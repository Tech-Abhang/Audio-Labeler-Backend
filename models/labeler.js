const mongoose = require("mongoose");

const LabelActivitySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    submissions: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const LabelerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    dp_list: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Datapoint",
      },
    ],
    rating: { type: Number, default: 0 },
    labelActivity: [LabelActivitySchema],
    dailyLimit: {
      type: Number,
      default: 25,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Labeler", LabelerSchema, "labelers");