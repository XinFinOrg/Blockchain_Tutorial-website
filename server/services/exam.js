const path = require("path");
var User = require("../models/user");
const questions = require("../models/question");
const ExamSession = require("../models/examSession");
const utils = require("../utils.js");
const renderCertificate = require("../helpers/renderCertificate");
const socialPostListener = require("../listeners/postSocial").em;
const GeoIP = require("geoip-lite");
// const blockchainHelper = require("../helpers/blockchainHelpers");

const examTypes = {
  basic: {
    courseName: "examBasic",
    questionName: "questionsBasic",
    coursePayment_id: "course_1",
  },
  advanced: {
    courseName: "examAdvanced",
    questionName: "questionsAdvanced",
    coursePayment_id: "course_2",
  },
  professional: {
    courseName: "examProfessional",
    questionName: "questionsProfessional",
    coursePayment_id: "course_3",
  },
  computing: {
    courseName: "examComputing",
    questionName: "questionsComputing",
    coursePayment_id: "course_4",
  },
  wallet: {
    courseName: "examWallet",
    questionName: "questionsWallet",
    coursePayment_id: "course_5",
  },
};

let { readJSONFile } = utils;

exports.submitExam = async (req, res, next) => {
  var marks = 0;
  const backUrl = req.header("Referer");
  const examName = backUrl.split("/")[3].split("-")[1];
  console.log(`User ${ req.user.email } submitted the exam ${ examName }.`);
  const request = JSON.parse(JSON.stringify(req.body, null, 2));
  let attempts = req.user.examData.examBasic.attempts;
  let attemptsAdvanced = req.user.examData.examAdvanced.attempts;
  let attemptsProfessional = req.user.examData.examProfessional.attempts;
  let attemptsComputing = req.user.examData.examComputing.attempts;
  let attemptsWallet = req.user.examData.examWallet.attempts;

  console.log("AttemptsComputing: ", attemptsComputing);
  if (attemptsComputing === undefined) attemptsComputing = 0;
  if (attemptsWallet === undefined) attemptsWallet = 0;


  var query = {};
  query = { email: req.user.email };
  let currUser;
  try {
    currUser = await User.findOne({ email: req.user.email });
  } catch (e) {
    console.error("Some error occured at exam.submitExam: ", e);
    res.json({
      status: false,
      error:
        "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
    });
    return;
  }
  if (currUser != null) {
    if (
      currUser.examData.payment[examTypes[examName].coursePayment_id] == true
    ) {
      if (examName === "basic") {
        if (attempts != null && attempts < 3) {
          questions.findOne({ exam: "firstExam" }).then((result, error) => {
            if (error) {
              console.error("Some error occured at exam.submitExam: ", error);
              res.json({
                status: false,
                error:
                  "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
              });
              return;
            }
            for (let index = 0; index < result.questionsBasic.length; index++) {
              if (
                parseInt(request[index]) + 1 ==
                result.questionsBasic[index].answer
              ) {
                marks++;
              }
            }
            attempts += 1;
            User.findOneAndUpdate(
              query,
              {
                $set: {
                  "examData.examBasic.attempts": attempts > 2 ? 0 : attempts,
                  "examData.examBasic.marks": marks,
                  "examData.payment.course_1": attempts <= 2,
                  "examData.payment.course_1_payment":
                    attempts <= 2
                      ? currUser.examData.payment.course_1_payment
                      : "",
                  "examData.payment.course_1_doner":
                    attempts <= 2
                      ? currUser.examData.payment.course_1_doner
                      : "",
                },
              },
              { upsert: false },
              (err, doc) => {
                if (err) {
                  console.error("Some error occured at exam.submitExam: ", err);
                  res.json({
                    status: false,
                    error:
                      "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                  });
                  return;
                }
                res.json({ status: true, error: null });
                return;
              }
            );
          });
        } else if (attempts >= 3) {
          attempts = 0;
          User.findOneAndUpdate(
            query,
            {
              $set: {
                "examData.examBasic.attempts": attempts,
                "examData.examBasic.marks": marks,
                "examData.payment.course_1": false,
                "examData.payment.course_1_payment": "",
                "examData.payment.course_1_doner": "",
              },
            },
            { upsert: false },
            (err, doc) => {
              if (err) {
                console.error("Some error occured at exam.submitExam: ", err);
                return res.json({
                  status: false,
                  error:
                    "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                });
              }
              res.json({ status: true, error: null });
              return;
            }
          );
        }
      } else if (examName === "advanced") {
        console.log("inside advanced");
        if (attemptsAdvanced != null && attemptsAdvanced < 3) {
          questions.findOne({ exam: "firstExam" }).then((result, error) => {
            for (
              let index = 0;
              index < result.questionsAdvanced.length;
              index++
            ) {
              if (
                parseInt(req.body[index]) + 1 ==
                result.questionsAdvanced[index].answer
              ) {
                marks++;
              }
            }
            attemptsAdvanced += 1;
            console.log("Marks", marks);
            User.findOneAndUpdate(
              query,
              {
                $set: {
                  "examData.examAdvanced.attempts":
                    attemptsAdvanced > 2 ? 0 : attemptsAdvanced,
                  "examData.examAdvanced.marks": marks,
                  "examData.payment.course_2": attemptsAdvanced <= 2,
                  "examData.payment.course_2_payment":
                    attemptsAdvanced <= 2
                      ? currUser.examData.payment.course_2_payment
                      : "",
                  "examData.payment.course_2_doner":
                    attemptsAdvanced <= 2
                      ? currUser.examData.payment.course_2_doner
                      : "",
                },
              },
              { upsert: false },
              (err, doc) => {
                if (err) {
                  console.error("Some error occured at exam.submitExam: ", err);
                  return res.json({
                    status: false,
                    error:
                      "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                  });
                }
                res.json({ status: true, error: null });
                return;
              }
            );
          });
        } else if (attemptsAdvanced >= 3) {
          attemptsAdvanced = 0;
          User.findOneAndUpdate(
            query,
            {
              $set: {
                "examData.examAdvanced.attempts": attemptsAdvanced,
                "examData.examAdvanced.marks": marks,
                "examData.payment.course_2": false,
                "examData.payment.course_2_payment": "",
                "examData.payment.course_2_doner": "",
              },
            },
            { upsert: false },
            (err, doc) => {
              if (err) {
                console.error("Some error occured at exam.submitExam: ", err);
                return res.json({
                  status: false,
                  error:
                    "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                });
              }
              res.json({ status: true, error: null });
              return;
            }
          );
        }
      } else if (examName === "professional") {
        if (attemptsProfessional != null && attemptsProfessional < 3) {
          questions.findOne({ exam: "firstExam" }).then((result, error) => {
            for (
              let index = 0;
              index < result.questionsProfessional.length;
              index++
            ) {
              if (
                parseInt(request[index]) + 1 ==
                result.questionsProfessional[index].answer
              ) {
                marks++;
              }
            }
            attemptsProfessional += 1;
            User.findOneAndUpdate(
              query,
              {
                $set: {
                  "examData.examProfessional.attempts":
                    attemptsProfessional > 2 ? 0 : attemptsProfessional,
                  "examData.examProfessional.marks": marks,
                  "examData.payment.course_3": attemptsProfessional <= 2,
                  "examData.payment.course_3_payment":
                    attemptsProfessional <= 2
                      ? currUser.examData.payment.course_3_payment
                      : "",
                  "examData.payment.course_3_doner":
                    attemptsProfessional <= 2
                      ? currUser.examData.payment.course_3_doner
                      : "",
                },
              },
              { upsert: false },
              (err, doc) => {
                console.log("err?", err);
                if (err) {
                  console.error("Some error occured at exam.submitExam: ", err);
                  return res.json({
                    status: false,
                    error:
                      "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                  });
                }
                res.json({ status: true, error: null });
                return;
              }
            );
          });
        } else if (attemptsProfessional >= 3) {
          attemptsProfessional = 0;
          User.findOneAndUpdate(
            query,
            {
              $set: {
                "examData.examProfessional.attempts": attemptsProfessional,
                "examData.examProfessional.marks": marks,
                "examData.payment.course_3": false,
                "examData.payment.course_3_payment": "",
                "examData.payment.course_3_doner": "",
              },
            },
            { upsert: false },
            (err, doc) => {
              if (err) {
                console.error("Some error occured at exam.submitExam: ", err);
                return res.json({
                  status: false,
                  error:
                    "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                });
              }
              res.json({ status: true, error: null });
              return;
            }
          );
        }
        //  else if (att >= 3) {
        //   attemptsComputing = 0;
        //   User.findOneAndUpdate(
        //     query,
        //     {
        //       $set: {
        //         "examData.examComputing.attempts": attemptsComputing,
        //         "examData.examComputing.marks": marks,
        //         "examData.payment.course_4": false,
        //         "examData.payment.course_4_payment": "",
        //         "examData.payment.course_4_doner": ""
        //       }
        //     },
        //     { upsert: false },
        //     (err, doc) => {
        //       if (err) {
        //         console.error("Some error occured at exam.submitExam: ", err);
        //         return res.json({
        //           status: false,
        //           error:
        //             "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience"
        //         });
        //       }
        //       res.json({ status: true, error: null });
        //       return;
        //     }
        //   );
        // }
      } else if (examName === "computing") {
        console.log("inside computing");
        if (attemptsComputing != null && attemptsComputing < 3) {
          questions.findOne({ exam: "firstExam" }).then((result, error) => {
            console.log(result.questionsComputing);

            for (
              let index = 0;
              index < result.questionsComputing.length;
              index++
            ) {
              if (
                parseInt(req.body[index]) + 1 ==
                result.questionsComputing[index].answer
              ) {
                marks++;
              }
            }
            attemptsComputing += 1;
            console.log("Marks", marks);
            User.findOneAndUpdate(
              query,
              {
                $set: {
                  "examData.examComputing.attempts":
                    attemptsComputing > 2 ? 0 : attemptsComputing,
                  "examData.examComputing.marks": marks,
                  "examData.payment.course_4": attemptsComputing <= 2,
                  "examData.payment.course_4_payment":
                    attemptsComputing <= 2
                      ? currUser.examData.payment.course_4_payment
                      : "",
                  "examData.payment.course_4_doner":
                    attemptsComputing <= 2
                      ? currUser.examData.payment.course_4_doner
                      : "",
                },
              },
              { upsert: false },
              (err, doc) => {
                if (err) {
                  console.error("Some error occured at exam.submitExam: ", err);
                  return res.json({
                    status: false,
                    error:
                      "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                  });
                }
                res.json({ status: true, error: null });
                return;
              }
            );
          });
        } else if (attemptsComputing >= 3) {
          attemptsComputing = 0;
          User.findOneAndUpdate(
            query,
            {
              $set: {
                "examData.examComputing.attempts": attemptsComputing,
                "examData.examComputing.marks": marks,
                "examData.payment.course_4": false,
                "examData.payment.course_4_payment": "",
                "examData.payment.course_4_doner": "",
              },
            },
            { upsert: false },
            (err, doc) => {
              if (err) {
                console.error("Some error occured at exam.submitExam: ", err);
                return res.json({
                  status: false,
                  error:
                    "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                });
              }
              res.json({ status: true, error: null });
              return;
            }
          );
        }
      }else if (examName === "wallet") {
        console.log("inside wallet", attemptsWallet);
        if (attemptsWallet != null && attemptsWallet < 3) {
          questions.findOne({ exam: "firstExam" }).then((result, error) => {
            console.log(result.questionsWallet);

            for (
              let index = 0;
              index < result.questionsWallet.length;
              index++
            ) {
              if (
                parseInt(req.body[index]) + 1 ==
                result.questionsWallet[index].answer
              ) {
                marks++;
              }
            }
            attemptsWallet += 1;
            console.log("Marks", marks);
            User.findOneAndUpdate(
              query,
              {
                $set: {
                  "examData.examWallet.attempts":
                    attemptsWallet > 2 ? 0 : attemptsWallet,
                  "examData.examWallet.marks": marks,
                  "examData.payment.course_5": attemptsWallet <= 2,
                  "examData.payment.course_5_payment":
                    attemptsWallet <= 2
                      ? currUser.examData.payment.course_5_payment
                      : "",
                  "examData.payment.course_5_doner":
                    attemptsWallet <= 2
                      ? currUser.examData.payment.course_5_doner
                      : "",
                },
              },
              { upsert: false },
              (err, doc) => {
                if (err) {
                  console.error("Some error occured at exam.submitExam: ", err);
                  return res.json({
                    status: false,
                    error:
                      "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                  });
                }
                res.json({ status: true, error: null });
                return;
              }
            );
          });
        } else if (attemptsWallet >= 3) {
          attemptsWallet = 0;
          User.findOneAndUpdate(
            query,
            {
              $set: {
                "examData.examWallet.attempts": attemptsWallet,
                "examData.examWallet.marks": marks,
                "examData.payment.course_5": false,
                "examData.payment.course_5_payment": "",
                "examData.payment.course_5_doner": "",
              },
            },
            { upsert: false },
            (err, doc) => {
              if (err) {
                console.error("Some error occured at exam.submitExam: ", err);
                return res.json({
                  status: false,
                  error:
                    "Something went wrong while submitting your exam, don't worry your attempt won't be lost. Sorry for the inconvenience",
                });
              }
              res.json({ status: true, error: null });
              return;
            }
          );
        }
      }
    }
  }
};

exports.getBasicExam = (req, res) => {
  readJSONFile(
    path.join(process.cwd(), "/server/protected/blockchain-basic.json"),
    (err, json) => {
      if (err != null) {
        return res.render("displayError", {
          error:
            "Something went wrong while fetching the exam, please try again later or contact us at info@blockdegree.org",
        });
      }
      console.log("Called getBasicExam");
      res.render("blockchainBasic", { examStr: JSON.stringify(json) });
    }
  );
};

exports.getAdvancedExam = (req, res) => {
  readJSONFile(
    path.join(process.cwd(), "/server/protected/blockchain-advanced.json"),
    (err, json) => {
      if (err) {
        return res.render("displayError", {
          error:
            "Something went wrong while fetching the exam, please try again later or contact us at info@blockdegree.org",
        });
      }
      res.render("blockchainAdvanced", { examStr: JSON.stringify(json) });
    }
  );
};

exports.getProfessionalExam = (req, res) => {
  readJSONFile(
    path.join(process.cwd(), "/server/protected/blockchain-Professional.json"),
    (err, json) => {
      if (err) {
        return res.render("displayError", {
          error:
            "Something went wrong while fetching the exam, please try again later or contact us at info@blockdegree.org",
        });
      }
      res.render("blockchainProfessional", { examStr: JSON.stringify(json) });
    }
  );
};

exports.getCCExam = (req, res) => {
  readJSONFile(
    path.join(process.cwd(), "/server/protected/cloud-computing.json"),
    (err, json) => {
      if (err) {
        return res.render("displayError", {
          error:
            "Something went wrong while fetching the exam, please try again later or contact us at info@blockdegree.org",
        });
      }
      res.render("cloudComputing", { examStr: JSON.stringify(json) });
    }
  );
};


exports.getBlockchainWalletExam = (req, res) => {
  readJSONFile(
    path.join(process.cwd(), "/server/protected/blockchain-wallet.json"),
    (err, json) => {
      if (err) {
        return res.render("displayError", {
          error:
            "Something went wrong while fetching the exam, please try again later or contact us at info@blockdegree.org",
        });
      }
      res.render("blockchainWallet", { examStr: JSON.stringify(json) });
    }
  );
};

exports.getExamResult = async (req, res) => {
  console.log(
    `called the exam-result endpoint by ${ req.user.email } at ${ Date.now() }`
  );
  const backUrl = req.header("Referer");
  console.log("BackURL: ", backUrl);
  if (backUrl == undefined) {
    // not a redirect
    res.render("error");
    return;
  }
  let trailPath = backUrl.split("/")[3];
  if (
    trailPath == undefined ||
    trailPath == null ||
    trailPath.split("-")[1] == undefined ||
    trailPath.split("-")[1] == null
  ) {
    // redirect from some other page
    res.render("error");
    return;
  }
  const examName = trailPath.split("-")[1];
  let name = "";
  if (req.user.name == "" || req.user.name == undefined) {
    // old email id.
    name = req.user.email;
  } else {
    name = req.user.name;
  }
  var query = {};
  query = { email: req.user.email };
  let user, ques;
  try {
    user = await User.findOne(query);

    ques = await questions.findOne({ exam: "firstExam" });
  } catch (err) {
    if (err) {
      console.log("error: ", err);
      res.render("displayError", {
        error: "Its not you, its us. Please try again after sometime.",
      });
    }
    return;
  }

  const totalQuestions = ques[examTypes[examName].questionName].length;
  const marksObtained = user.examData[examTypes[examName].courseName].marks;
  const percentObtained = (marksObtained * 100) / totalQuestions;
  let examStatus;
  let jsonData = {
    exam: {
      examBasic: examName == "basic",
      examAdvanced: examName == "advanced",
      examProfessional: examName == "professional",
      examComputing: examName == "computing",
      examWallet: examName == "wallet",
    },
    data: user,
    obtainedMarks: marksObtained,
    percent: percentObtained,
    total: totalQuestions,
  };
  let passingPercent = 60;
  if (examName == "basic" || examName == "computing" || examName == "wallet") {
    passingPercent = 40;
  } else if (examName == "advanced") {
    passingPercent = 50;
  } else {
    passingPercent = 60;
  }
  if (percentObtained >= passingPercent) {
    // Yeah!
    examStatus = true;
    let d = new Date();
    console.log(`Last Attemp timestamp : ${ findLastAttempt(user, examName) }`);
    if (user.examData.payment[examTypes[examName].coursePayment_id] != true) {
      return res.redirect("/exams");
    }
    let donerName =
      user.examData.payment[`${ examTypes[examName].coursePayment_id }_doner`];
    // Post the 2 certificates
    renderCertificate.renderForIPFSHash(
      name,
      percentObtained,
      examName,
      d,
      donerName,
      (bothRender) => {
        if (!bothRender.uploaded) {
          console.log("error:", bothRender);
          return res.render("displayError", {
            error: "Its not you, its us. Please try again after some time.",
          });
        } else {
          jsonData.certificateHash = bothRender.hash[1];
          jsonData.examStatus = examStatus;
          user.examData[examTypes[examName].courseName].attempts = 0;
          user.examData.payment[examTypes[examName].coursePayment_id] = false;
          var obj = {};
          const expiryDate = d;
          expiryDate.setDate(expiryDate.getDate() - 1);
          expiryDate.setFullYear(expiryDate.getFullYear() + 2);
          expiryDate.setHours(23, 59, 59, 999);
          obj["timestamp"] = Date.now();
          obj["marks"] = marksObtained;
          obj["total"] = totalQuestions;
          obj["headlessHash"] = bothRender.hash[0];
          obj["clientHash"] = bothRender.hash[1];
          obj["examType"] = examName;
          obj["paymentMode"] =
            user.examData.payment[
              examTypes[examName].coursePayment_id + "_payment"
            ] === undefined
              ? ""
              : user.examData.payment[
              examTypes[examName].coursePayment_id + "_payment"
              ];
          obj["expiryDate"] = expiryDate.getTime();
          user.examData.certificateHash.push(obj);
          user.examData.payment[
            examTypes[examName].coursePayment_id + "_payment"
          ] = "";
          user.examData.payment[
            examTypes[examName].coursePayment_id + "_doner"
          ] = "";
          user.save();
          res.render("examResult", jsonData);
          socialPostListener.emit("varTriggerUpdate", "certificates");


          /**
           * 
           * UPDATE MODAL FORR EXAM SESSION
           * 
           * marks:,
           * headlessHash:
           * clientHash:
           * status:pass
           * 
           */
          ExamSession.findOneAndUpdate({ email: req.user.email }, { $set: { marks: percentObtained, headlessHash: obj.headlessHash, clientHash: obj.clientHash, status: "pass" } }).sort({ createdAt: -1 });
          return;
        }
      }
    );
  } else {
    // No!
    jsonData.examStatus = false;
    res.render("examResult", jsonData);

    /**
     * 
     * UPDATE MODAL FORR EXAM SESSION
     * 
     * marks:,
     * headlessHash:""
     * clientHash:""
     * status:fail
     * 
     */
    ExamSession.findOneAndUpdate({ email: req.user.email }, { $set: { marks: percentObtained, headlessHash: "", clientHash: "", status: "fail" } }).sort({ createdAt: -1 });
    return;
  }
};

exports.getExamStatus = async (req, res) => {
  console.log("local exam: ");
  const fromIP = req.headers["x-forwarded-for"] || req.ip;
  let geo = GeoIP.lookup(fromIP);
  var query = {};
  query = { email: req.user.email };
  await User.findOne(query, function (err, user) {
    if (err != null) {
      console.log("error:", err);
      return res.render("displayError", {
        error: "Its not you, its us. Please try again after sometime.",
      });
    }
    readJSONFile(
      path.join(process.cwd(), "/dist/data/courses.json"),
      (err, json) => {
        if (err != null) {
          console.log("error:", err);
          return res.render("displayError", {
            error: err,
          });
        }
        const examListData = {
          data: {
            course_1: user.examData.payment.course_1,
            course_2: user.examData.payment.course_2,
            course_3: user.examData.payment.course_3,
            course_4: user.examData.payment.course_4,
            course_5: user.examData.payment.course_5,
          },
          json: json,
          video: user.videoSubscription === true,
          country: geo ? geo.country : "unknown",
        };
        res.render("examList", examListData);
      }
    );
  });
};

function findLastAttempt(user, examName) {
  let certiCount = user.examData.certificateHash.length;
  for (let i = certiCount - 1; i >= 0; i--) {
    if (user.examData.certificateHash[i].examType == examName) {
      return user.examData.certificateHash[i].timestamp;
    }
  }
  return null;
}

function scrambleQuestions(jsonData) {
  let scrambledData = jsonData;
  const len = jsonData.exam.length;
  for (let i = 0; i < len - 1; i++) {
    const x = Math.floor(Math.random() * (len - 1));
    const y = Math.floor(Math.random() * (len - 1));
    let tmp = scrambledData.exam[x];
    scrambledData.exam[x] = scrambledData.exam[y];
    scrambledData.exam[y] = tmp;
  }
  return scrambledData;
}
