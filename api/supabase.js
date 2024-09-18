require("dotenv").config();
const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

router.get("/checking-supabase-router", async (req, res) => {
  res.json({ message: "Supabase router is working" });
});

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
