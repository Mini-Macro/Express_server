const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = "https://cpakisgxlfrzicpigely.supabase.co/";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwYWtpc2d4bGZyemljcGlnZWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM2MjkyMTAsImV4cCI6MjAzOTIwNTIxMH0.CZS415GclZwrmMf-5zcJqY0c9B0WvJwueVHNPPwFqIQ";
const supabase = createClient(supabaseUrl, supabaseKey);

const insertData = async (tableName, data, companyId, res) => {
  try {
    const { data: insertedData, error } = await supabase
      .from(tableName)
      .insert([{ data, companyId }])
      .select("id, data, companyId, created_at, updated_at");

    if (error) throw error;

    res.status(200).json(insertedData[0]);
  } catch (error) {
    console.error(`Error inserting data into ${tableName}:`, error);
    res.status(500).send("Internal server error");
  }
};

router.post("/insertData", (req, res) => {
  const { data, companyId } = req.body;
  insertData("forms", data, companyId, res);
});

router.post("/insertPatientData", (req, res) => {
  const { data, companyId } = req.body;
  insertData("patientmasterform", data, companyId, res);
});

router.post("/insertDoctorData", (req, res) => {
  const { data, companyId } = req.body;
  insertData("doctormaster", data, companyId, res);
});

router.post("/insertOperatorData", (req, res) => {
  const { data, companyId } = req.body;
  insertData("operatormaster", data, companyId, res);
});

router.post("/insertBillingData", (req, res) => {
  const { data, companyId } = req.body;
  insertData("billingform", data, companyId, res);
});

module.exports = router;
