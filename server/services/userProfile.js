const User = require("../models/user");
const PaymentToken = require("../models/payment_token");
const CoursePrice = require("../models/coursePrice");
const PaymentLog = require("../models/payment_logs");
/*

All the below APIs (except setProfileName) are NOT in use; no need to OPTIMIZE

*/

exports.setupProfile = async (req, res) => {
  console.log("called setup profile");
  let user;
  try {
    user = await User.findOne({ email: req.user.email });
  } catch (e) {
    console.error(`Exception in setupProfile ${e}`);
    res.render("displayError", { error: "Exception in setup profile" });
  }
  if (!user) {
    return console.error(`User not found, seems like the DB is down`);
  }
  // check for req.body params, omitting now
  let newProfile = {
    photo: {
      name: "",
      buffer: ""
    },
    education_details: [{}]
  };
  newProfile.education_details = [{ any: "ok" }];
  newProfile.photo.name = res.locals.file_name;
  newProfile.photo.buffer = req.file.buffer.toString("base64");
  user.profile = newProfile;
  try {
    await user.save();
  } catch (e) {
    res.render("displayError", { error: "error while saving the newProfile" });
  }
  res.json({ msg: "ok" });
};

exports.getProfile = async (req, res) => {
  console.log("called get profile");
  const user = await User.findOne({ email: req.user.email }).catch(e =>
    console.error(`Exception in setupProfile ${e}`)
  );
  if (!user) {
    return console.error(`User not found, seems like the DB is down`);
  }
  res.json(user.profile);
};

exports.addProfileEdu = async (req, res) => {
  console.log("called add profile edu");
  const user = await User.findOne({ email: req.user.email }).catch(e =>
    console.error(`Exception in setupProfile ${e}`)
  );
  if (!user) {
    return console.error(`User not found, seems like the DB is down`);
  }
  await User.updateOne(
    { email: req.user.email },
    { $push: { "profile.education_details": { test: "ok" } } }
  );
  await user.save();
  res.json({ msg: "ok" });
};

exports.updateProfilePhoto = async (req, res) => {
  console.log("called update profile photo");
  const user = await User.findOne({ email: req.user.email }).catch(e =>
    console.error(`Exception in setupProfile ${e}`)
  );
  if (!user) {
    return console.error(`User not found, seems like the DB is down`);
  }
  user.profile.photo.name = res.locals.file_name;
  user.profile.photo.buffer = req.file.buffer.toString("base64");
  user.save();
};

exports.deleteProfileEdu = async (req, res) => {
  console.log("called delete profile edu");
  const user = await User.findOne({ email: req.user.email }).catch(e =>
    console.error(`Exception in setupProfile ${e}`)
  );
  if (!user) {
    return console.error(`User not found, seems like the DB is down`);
  }
  req.body.eduDels.forEach(edu => {
    delete user.profile.education_details[edu];
  });
  user.save();
  res.json({ msg: "ok" });
};

exports.updateSocial = async (req, res) => {
  // let user = await User.findOne({ email: req.user.email });
};
exports.removeSocial = async (req, res) => {
  let social = req.body.social;
  let user = await User.findOne({ email: req.user.email });
  if (user != null) {
    // found user
    console.log(
      `Request to remove social ${social} for user ${req.user.email}`
    );
    let couldRemove = false;
    Object.keys(user.auth).forEach(currAuth => {
      console.log(currAuth);
      if (currAuth != social) {
        Object.keys(user.auth[currAuth]).forEach(currKey => {
          console.log(currKey);
          if (currKey == "$init") return;
          let currVal = user.auth[currAuth][currKey];
          if (currVal == undefined || currVal == "" || currVal == "false") {
            // monkaS
          } else {
            couldRemove = true;
          }
        });
      }
    });
    if (!couldRemove) {
      return res.json({
        error: "looks like this is your only id, cannot delete",
        status: false
      });
    }
    if (user.auth[social] != undefined || user.auth[social].id != "") {
      const authKeys = Object.keys(user.auth[social]);
      authKeys.forEach(key => {
        user.auth[social][key] = "";
      });
      await user.save();
      return res.json({ message: "ok", status: true });
    }
  }
};

/*

The API below is the only API which is in USE

*/
exports.setProfileName = async (req, res) => {
  let user;
  try {
    user = await User.findOne({ email: req.user.email });
  } catch (e) {
    console.error(
      `Error occured at setProfileName for user : ${req.user.email} : ${e}`
    );
    return res.json({
      updated: false,
      error:
        "Its not you, its us. Please try again after sometime or contact-us at info@blockdegree.org"
    });
  }
  if (user == null) {
    return res.json({
      updated: false,
      error: `No user ${req.user.email} found!!`
    });
  }
  user.name = req.body.fullName;
  try {
    await user.save();
  } catch (e) {
    console.error(
      `Error occured at setProfileName for user ${req.user.email} `,
      e
    );
    return res.json({
      updated: false,
      error:
        "Its not you, its us. Please try again after sometime or contact-us at info@blockdegree.org"
    });
  }
  res.json({
    updated: true,
    error: null
  });
};

exports.getUserPaypalPayment = async (req, res) => {
  console.log("Called getUserPaypalPayment");
  try {
    const logs = await PaymentLog.find({
      email: req.user.email
    }).lean();

    return res.json({
      status: true,
      error: null,
      logs: logs
    });
  } catch (e) {
    console.error(
      "Some error occured at userProfile.getUserPaypalPayment while fetching the payments: ",
      e
    );
    return res.json({
      status: false,
      error: "internal error",
      allPayments: null
    });
  }
};

/*

  Mini explorer for user payments based in crypto payments

*/
exports.getUserCryptoPayment = async (req, res) => {
  console.log("Called getUserCryptoPayment");
  try {
    const allUserPayments = await PaymentToken.find({
      email: req.user.email
    }).lean();
    for (let i = 0; i < allUserPayments.length; i++) {
      const course = await CoursePrice.findOne({
        courseId: allUserPayments[i].course
      });
      allUserPayments[i].courseName = course.courseName;
      allUserPayments[i].coursePriceUsd = course.priceUsd;
      allUserPayments[i].xdceConfirmation = course.xdceConfirmation;
      allUserPayments[i].xdcConfirmation = course.xdcConfirmation;
      let willBurn = false;
      for (let x = 0; x < course.burnToken.length; x++) {
        if (course.burnToken[x].tokenName == allUserPayments[i].tokenName) {
          // found the token
          willBurn = course.burnToken[x].autoBurn;
        }
      }
      allUserPayments[i].willBurn = willBurn;
    }
    return res.json({
      status: true,
      error: null,
      allPayments: allUserPayments
    });
  } catch (e) {
    console.error(
      "Some error occured at userProfile.getUserCryptoPayment while fetching the payments: ",
      e
    );
    return res.json({
      status: false,
      error: "internal error",
      allPayments: null
    });
  }
};

exports.getCourseMeta = async (req, res) => {
  try {
    if (
      req.body.courseId.trim() == undefined ||
      req.body.courseId.trim() == null ||
      req.body.courseId.trim() == ""
    ) {
      return res.json({ status: false, error: "bad request", data: null });
    }
    const courseMeta = await CoursePrice.findOne({
      courseId: req.body.courseId.trim()
    });
    if (courseMeta == null) {
      // no course found with
      return res.json({
        status: false,
        error: "no course exixts with given courseId",
        data: null
      });
    }
    let retObj = {
      courseId: courseMeta.courseId,
      courseName: courseMeta.courseName,
      xdceConfirmation: courseMeta.xdceConfirmation,
      xdcConfirmation: courseMeta.xdcConfirmation,
      priceUsd: courseMeta.priceUsd
    };
    return res.json({ status: true, error: null, data: retObj });
  } catch (e) {
    console.error(
      "Some error occured at userProfile.getCourseMeta while fetching the payments: ",
      e
    );
    return res.json({
      status: false,
      error: "internal error",
      data: null
    });
  }
};
