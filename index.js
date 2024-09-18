const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const powerbiRoutes = require("./routes/powerbi");
const supabaseRoutes = require("./routes/supabase");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Use the routes
app.use("/powerbi", powerbiRoutes);
app.use("/supabase", supabaseRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
