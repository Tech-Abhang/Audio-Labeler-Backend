const Redis = require("ioredis");
const Datapoint = require("../models/datapoint");
const { redisClient } = require("./redisClient");

const redis = redisClient;

const LABEL_LENGTH_WEIGHT = 3;
const DATAPOINT_AGE_WEIGHT = 5;
const USER_PRIORITY_WEIGHT = 8;
const DP_LABELER_LIST = "dp_labeler_list";

const initializeLabelerList = async () => {
  try {
    await redis.del(DP_LABELER_LIST);
    const pipeline = redis.pipeline();
    const datapoints = await Datapoint.find({
      processingStatus: "live-label-mcq",
      labeledBy: "labeler",
      isFreezed: false,
    }).sort({ createdBy: 1 });
    if (!datapoints.length) {
      console.error("Couldn't find datapoints for labelers list!");
      return;
    }

    datapoints.forEach((dp) => pipeline.rpush(DP_LABELER_LIST, dp._id));
    const results = await pipeline.exec();

    // Check for errors in Redis
    const errors = results.filter((r) => r[0] instanceof Error);
    if (errors.length) {
      console.error(errors, "Redis command errors");
      return;
    }
    console.log("Labeler List of DP Created Successfully!");
  } catch (error) {
    console.error("Failed to create dp list for labeler:", error);
  }
};

module.exports = {
  initializeLabelerList,
};