const express = require("express");
const router = express.Router();
const { saveFeedback, getAllFeedbacks } = require("../controllers/feedbackController");

router.post("/", saveFeedback);
router.get("/", getAllFeedbacks);

module.exports = router;
