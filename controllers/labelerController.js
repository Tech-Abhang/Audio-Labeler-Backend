const Datapoint = require("../models/datapoint");
const User = require("../models/user");
const Labeler = require("../models/labeler");
const { initializeLabelerList } = require("../utils/lib");
const { redisClient } = require("../utils/redisClient");

const DP_LABELER_LIST = "dp_labeler_list";
const redis = redisClient;

const getDatapoint = async (req, res) => {
  try {
    const labelerId = req.labeler.id;
    const labeler = await Labeler.findById(labelerId);
    if (!labeler) {
      return res
        .status(404)
        .json({ success: false, message: "Labeler not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayActivity = labeler.labelActivity.find(
      (activity) => activity.date.getTime() === today.getTime()
    );

    if (todayActivity && todayActivity.submissions >= labeler.dailyLimit) {
      return res.status(403).json({
        success: false,
        message: "Daily submission limit reached. Please try again tomorrow.",
      });
    }
    const rawDatapointId = await redis.lpop(DP_LABELER_LIST);
    if (!rawDatapointId) {
      return res
        .status(200)
        .json({ success: false, message: "DP List is empty!" });
    }
    const datapointId = rawDatapointId.toString();
    const datapoint = await Datapoint.findById(datapointId);
    if (!datapoint) {
      return res
        .status(404)
        .json({ success: false, message: "Datapoint couldn't be found!" });
    }
    res.status(200).json({ success: true, datapoint });
  } catch (error) {
    console.error("Failed to send Datapoint! ", error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message,
    });
  }
};

const addLabel = async (req, res) => {
  try {
    const { transcripts,datapointId } = req.body;
    const labelerId = req.labeler.id;

    const datapoint = await Datapoint.findById(datapointId);

    if (!datapoint) {
      return res
        .status(404)
        .json({ success: false, message: "Datapoint not found" });
    }

    // Update transcripts if provided
    if (transcripts && Array.isArray(transcripts)) {
      datapoint.transcripts = transcripts;
    }
    datapoint.processingStatus = "completed";

    await datapoint.save();

    const labeler = await Labeler.findById(labelerId);
    if (labeler) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayActivity = labeler.labelActivity.find(
        (activity) => activity.date.getTime() === today.getTime()
      );

      if (todayActivity) {
        todayActivity.submissions += 1;
      } else {
        labeler.labelActivity.push({ date: today, submissions: 1 });
      }
      labeler.dp_list.push(datapointId);
      await labeler.save();
    }

    const user = await User.findOne({ "projects._id": datapoint.project_id });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with that project not found" });
    }

    // Now find the exact project inside user's projects array
    const project = user.projects.id(datapoint.project_id);

    if (!project) {
      return res.status(404).json({ message: "Project not found inside user" });
    }

    const datapointsfromTask = await Datapoint.find({
      task_id: datapoint.task_id,
    });
    const onGoingDatapoints = datapointsfromTask.filter(
      (dp) => dp.processingStatus !== "completed"
    );
    if (!onGoingDatapoints.length) {
      const task = project.tasks.id(datapoint.task_id);
      task.processingStatus = "completed";
    }

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Label added successfully" });
  } catch (error) {
    console.error("Failed to add label!", error);
    res.status(500).json({
      success: false,
      error: error.name,
      message: error.message,
    });
  }
};

setInterval(() => {
  initializeLabelerList();
}, 5 * 60 * 1000);

module.exports = { getDatapoint, addLabel };