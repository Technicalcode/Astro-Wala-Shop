import PageViewModel from "../Model/pageview.model.js";
import DailyTraffic from "../Model/DailyTraffic.model.js";

export const TrackPageView = async (req, res) => {
  try {
    const { path, name } = req.body;

    if (!path || !name) {
      return res.status(400).json({
        success: false,
        message: "Path and name are required",
      });
    }

    // Upsert the page view: increment viewCount if it exists, otherwise create it with viewCount: 1
    const pageView = await PageViewModel.findOneAndUpdate(
      { path },
      {
        $setOnInsert: { name },
        $inc: { viewCount: 1 },
      },
      { new: true, upsert: true, returnDocument: 'after' }
    );

    return res.status(200).json({
      success: true,
      message: "Page view tracked successfully",
      data: pageView,
    });
  } catch (error) {
    console.error("Error in TrackPageView:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while tracking page view",
    });
  }
};

export const GetPageViews = async (req, res) => {
  try {
    const pageViews = await PageViewModel.find().sort({ viewCount: -1 });

    return res.status(200).json({
      success: true,
      message: "Page views fetched successfully",
      data: pageViews,
    });
  } catch (error) {
    console.error("Error in GetPageViews:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching page views",
    });
  }
};

export const TrackVisitor = async (req, res) => {
  try {
    const { type } = req.body; // "new" or "returning"
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    let update = { $inc: { totalUsers: 1 } };
    if (type === "new") {
      update.$inc.newUsers = 1;
    } else if (type === "returning") {
      update.$inc.returningUsers = 1;
    }

    const traffic = await DailyTraffic.findOneAndUpdate({ date }, update, {
      returnDocument: "after",
      upsert: true,
    });

    return res.status(200).json({
      success: true,
      message: "Visitor tracked successfully",
      data: traffic,
    });
  } catch (error) {
    console.error("Error in TrackVisitor:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while tracking visitor",
    });
  }
};

export const GetDailyTraffic = async (req, res) => {
  try {
    // Get traffic for the last 30 days
    const traffic = await DailyTraffic.find().sort({ date: -1 }).limit(30);

    return res.status(200).json({
      success: true,
      message: "Daily traffic fetched successfully",
      data: traffic.reverse(), // Return chronological order
    });
  } catch (error) {
    console.error("Error in GetDailyTraffic:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching daily traffic",
    });
  }
};
