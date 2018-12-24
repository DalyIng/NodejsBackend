const express = require("express");
const router = express.Router();

const ctrlUser = require("../controllers/user.controller");

const jwtHelper = require("../config/jwtHelper");

router.get("/", ctrlUser.getAllUsuers);
router.post("/register", ctrlUser.register);
router.post("/authenticate", ctrlUser.authenticate);
router.get("/userProfile", jwtHelper.verifyJwtToken, ctrlUser.userProfile);
router.put("/userProfile/:id", jwtHelper.verifyJwtToken, ctrlUser.modifyUser);
router.put("/addfriend/:id", jwtHelper.verifyJwtToken, ctrlUser.addfriend);
router.put(
  "/deletefriend/:id",
  jwtHelper.verifyJwtToken,
  ctrlUser.deletefriend
);
module.exports = router;
