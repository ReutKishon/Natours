const express = require("express");
const { protect, restrictTo } = require("../controllers/authContorller");
const reviewController = require("../controllers/reviewController");
const router = express.Router({ mergeParams: true });
router.use(protect);
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    restrictTo("user"),
    reviewController.setUserTourIds,
    reviewController.createReview
  );

router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(restrictTo("user", "admin"), reviewController.updateReview)
  .delete(restrictTo("user", "admin"), reviewController.deleteReview);
module.exports = router;
