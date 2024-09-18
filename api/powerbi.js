require("dotenv").config();
const express = require("express");
const axios = require("axios");
const qs = require("qs");

const router = express.Router();

router.get("/checking-powerbi-router", async (req, res) => {
  res.json({ message: "PowerBI router is working" });
});

router.post("/get-report-by-name", async (req, res) => {
  const { reportName } = req.body;

  if (!reportName) {
    return res.status(400).send("Report name is required");
  }

  try {
    // Step 1: Get the token from Microsoft
    let tokenResponse;
    try {
      const data = qs.stringify({
        grant_type: "client_credentials",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        scope: "https://analysis.windows.net/powerbi/api/.default",
      });

      tokenResponse = await axios.post(
        "https://login.microsoftonline.com/37b8fff0-c992-4c48-9b9c-a74a650cb766/oauth2/v2.0/token",
        data,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );
      console.log("Token fetched successfully.");
    } catch (error) {
      console.error(
        "Error fetching token:",
        error.response ? error.response.data : error.message
      );
      return res.status(500).send("Failed to fetch token");
    }

    const token = tokenResponse.data.access_token;

    // Step 2: Get the groups
    let groupsResponse;
    try {
      groupsResponse = await axios.get(
        "https://api.powerbi.com/v1.0/myorg/groups",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Groups fetched successfully.");
    } catch (error) {
      console.error(
        "Error fetching groups:",
        error.response ? error.response.data : error.message
      );
      return res.status(500).send("Failed to fetch groups");
    }

    const groupId = groupsResponse.data.value[0].id;

    // Step 3: Get the reports in the group
    let reportsResponse;
    try {
      reportsResponse = await axios.get(
        `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/reports`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Reports fetched successfully.");
    } catch (error) {
      console.error(
        "Error fetching reports:",
        error.response ? error.response.data : error.message
      );
      return res.status(500).send("Failed to fetch reports");
    }

    // Step 4: Find the matching report by name
    const matchingReport = reportsResponse.data.value.find(
      (report) => report.name === reportName
    );

    if (!matchingReport) {
      return res.status(404).send("Report not found");
    }

    // Return the matching report details
    const { id: reportId, name: foundReportName, webUrl } = matchingReport;
    res.json({ reportId, reportName: foundReportName, webUrl });
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
