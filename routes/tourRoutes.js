const express = require("express");
const {
  getDistances,
  getAllTours,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  createTour,
  getToursWithin,
  uploadTourImages,
  resizeTourImages,
} = require("../controllers/tourController");
const reviewRouter = require("./reviewRoutes");
const { protect, restrictTo } = require("../controllers/authContorller");

const router = express.Router();

// router.param("id", checkId);
router.route("/").get(getAllTours).post(protect, createTour);
router
  .route("/:id")
  .get(getTour)
  .patch(
    protect,
    restrictTo("admin", "lead-guide"),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

router.use("/:tourId/reviews", reviewRouter);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);
router.route("/distances/:latlng/unit/:unit").get(getDistances);

router.route("/top-5-cheap").get(aliasTopTours, getAllTours);
router.route("/tours-stats").get(getTourStats);
router.route("/monthly-plan/:year").get(getMonthlyPlan);

module.exports = router;
