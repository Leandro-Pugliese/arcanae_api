const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { db } = require("./DB/db");
const Router = require("./Routes/routes");


const app = express();
app.use(express.json());
app.use(cors());
db();
app.use(Router);
app.listen(process.env.PORT, () => console.log(`Server running at port: ${process.env.PORT}`));