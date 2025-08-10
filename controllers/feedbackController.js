// controllers/feedbackController.js
const Feedback = require("../models/FeedBackModel");

exports.saveFeedback = async (req, res) => {
  try {
    const { name, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Feedback message is required" });
    }

    const feedback = new Feedback({
      name: name.trim(),
      message: message.trim(),
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback saved successfully" });
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ error: "Server error" });
  }
};
