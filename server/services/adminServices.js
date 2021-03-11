const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const uuidv4 = require("uuid/v4");
const CoursePrice = require("../models/coursePrice");
const AllWallet = require("../models/wallet");
const KeyConfig = require("../config/keyConfig");
const ReferralCode = require("../models/referral_code");
const PromoCodeLog = require("../models/promocode_log.js");
const PaymentLog = require("../models/payment_logs");
const CryptoLog = require("../models/payment_token");
const BurnLog = require("../models/burn_logs");
const SocialPostTemplates = require("../models/socialPostTemplates");
const UserFundRequest = require("../models/userFundRequest");
const pendingEmitter = require("../listeners/pendingTx").em;
const DonationListener = require("../listeners/donationListener");
const referralEmitter = require("../listeners/userReferral").em;
const UserReferral = require("../models/userReferral");
const Questions = require("../models/question");
const SocialShare = require("../models/socialShare");
const UserSessions = require("../models/userSessions");
const razorpaylog = require('../models/razorpay_payment');
const { renderFunderCerti } = require("../helpers/renderFunderCerti");
const {
  makeValueTransferXDC,
  getBalance,
  getTransactionTimestamp,
} = require("../helpers/blockchainHelpers");
const emailer = require("../emailer/impl");
const kycDetails = require("../models/kycDetails");
const userReferral = require("../models/userReferral");
const userFundRequest = require("../models/userFundRequest");
const examSession = require("../models/examSession");

exports.addCourse = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.courseName == undefined ||
    req.body.courseName == "" ||
    req.body.coursePriceUsd == undefined ||
    req.body.coursePriceUsd == "" ||
    req.body.xdceTolerance == undefined ||
    req.body.xdceTolerance == "" ||
    req.body.xdceConfirmation == undefined ||
    req.body.xdceConfirmation == "" ||
    req.body.xdcTolerance == undefined ||
    req.body.xdcTolerance == "" ||
    req.body.xdcConfirmation == undefined ||
    req.body.xdcConfirmation == ""
  ) {
    res.json({ error: "bad request", status: false });
    return;
  }
  let newCourse = newDefCourse(req.body.courseId);
  newCourse.courseId = req.body.courseId;
  newCourse.courseName = req.body.courseName;
  newCourse.priceUsd = req.body.coursePriceUsd;
  newCourse.xdcTolerance = req.body.xdcTolerance;
  newCourse.xdceTolerance = req.body.xdceTolerance;
  newCourse.xdceConfirmation = req.body.xdceConfirmation;
  newCourse.xdcConfirmation = req.body.xdcConfirmation;

  try {
    await newCourse.save();
  } catch (saveError) {
    console.error(
      "Some error occured while trying to save the model: ",
      saveError
    );
    res.json({
      status: false,
      error: "internal error while saving the new model",
    });
    return;
  }
  res.json({ status: true, error: null });
};

exports.setXdceTolerance = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.xdceTolerance == undefined ||
    req.body.xdceTolerance == ""
  ) {
    console.error("Bad request at adminServices.setXdceTolerance");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    let course = await CoursePrice.findOne({ courseId: req.body.courseId });
    let filteredTolerance = req.body.xdceTolerance.trim();
    if (course == null) {
      console.error(
        "Bad request at adminServices.setXdceTolerance, course not found"
      );
      res.json({ status: false, error: "bad request, course not found" });
      return;
    }
    // course found
    if (course.xdceTolerance === filteredTolerance) {
      // same value, no need to set it again
      console.error("bad request, same XdceTolerance as the existing value");
      res.json({
        status: false,
        error: "bad request, same value of the xdceTolerance",
      });
      return;
    }
    course.xdceTolerance = filteredTolerance;
    await course.save();
  } catch (e) {
    console.error(
      "Some exception occured ay adminServices.setXdceTolerance: ",
      e
    );
    res.json({ status: false, error: "internal error" });
    return;
  }
  res.json({ status: true, error: null });
};

exports.setXdcTolerance = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.xdcTolerance == undefined ||
    req.body.xdcTolerance == ""
  ) {
    console.error("Bad request at adminServices.setXdcTolerance");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    let course = await CoursePrice.findOne({ courseId: req.body.courseId });
    let filteredTolerance = req.body.xdcTolerance.trim();
    if (course == null) {
      console.error(
        "Bad request at adminServices.setXdcTolerance, course not found"
      );
      res.json({ status: false, error: "bad request, course not found" });
      return;
    }
    // course found
    if (course.xdcTolerance === filteredTolerance) {
      // same value, no need to set it again
      console.error("bad request, same XdcTolerance as the existing value");
      res.json({
        status: false,
        error: "bad request, same value of the xdcTolerance",
      });
      return;
    }
    course.xdcTolerance = filteredTolerance;
    await course.save();
  } catch (e) {
    console.error(
      "Some exception occured ay adminServices.setXdcTolerance: ",
      e
    );
    res.json({ status: false, error: "internal error" });
    return;
  }
  res.json({ status: true, error: null });
};

exports.setPriceUsd = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.priceUsd == undefined ||
    req.body.priceUsd == ""
  ) {
    console.error("Bad request at adminServices.setPriceUsd");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    let course = await CoursePrice.findOne({ courseId: req.body.courseId });
    let filteredPrice = req.body.priceUsd.trim();
    if (course == null) {
      console.error(
        "Bad request at adminServices.setPriceUsd, course not found"
      );
      res.json({ status: false, error: "bad request, course not found" });
      return;
    }
    // course found
    if (course.priceUsd === filteredPrice) {
      // same value, no need to set it again
      console.error("bad request, same priceUsd as the existing value");
      res.json({
        status: false,
        error: "bad request, same value of the priceUsd",
      });
      return;
    }
    course.priceUsd = filteredPrice;
    await course.save();
  } catch (e) {
    console.error("Some exception occured ay adminServices.priceUsd: ", e);
    res.json({ status: false, error: "internal error" });
    return;
  }
  res.json({ status: true, error: null });
};

exports.setXdceConfirmation = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.xdceConfirmation == undefined ||
    req.body.xdceConfirmation == ""
  ) {
    console.error("Bad request at adminServices.setXdceConfirmation");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    let course = await CoursePrice.findOne({ courseId: req.body.courseId });
    let filteredConfirmation = req.body.xdceConfirmation.trim();
    if (course == null) {
      console.error(
        "Bad request at adminServices.setXdceConfirmation, course not found"
      );
      res.json({ status: false, error: "bad request, course not found" });
      return;
    }
    // course found
    if (course.xdceConfirmation === filteredConfirmation) {
      // same value, no need to set it again
      console.error(
        "bad request, same confirmation number as the existing value"
      );
      res.json({
        status: false,
        error: "bad request, same value of the confirmations",
      });
      return;
    }
    course.xdceConfirmation = filteredConfirmation;
    await course.save();
  } catch (e) {
    console.error(
      "Some exception occured ay adminServices.setXdceConfirmation: ",
      e
    );
    res.json({ status: false, error: "internal error" });
    return;
  }
  res.json({ status: true, error: null });
};

exports.setXdcConfirmation = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.xdcConfirmation == undefined ||
    req.body.xdcConfirmation == ""
  ) {
    console.error("Bad request at adminServices.setXdcConfirmation");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    let course = await CoursePrice.findOne({ courseId: req.body.courseId });
    let filteredConfirmation = req.body.xdcConfirmation.trim();
    if (course == null) {
      console.error(
        "Bad request at adminServices.setXdcConfirmation, course not found"
      );
      res.json({ status: false, error: "bad request, course not found" });
      return;
    }
    // course found
    if (course.xdcConfirmation === filteredConfirmation) {
      // same value, no need to set it again
      console.error(
        "bad request, same confirmation number as the existing value"
      );
      res.json({
        status: false,
        error: "bad request, same value of the confirmations",
      });
      return;
    }
    course.xdcConfirmation = filteredConfirmation;
    await course.save();
  } catch (e) {
    console.error(
      "Some exception occured ay adminServices.setXdcConfirmation: ",
      e
    );
    res.json({ status: false, error: "internal error" });
    return;
  }
  res.json({ status: true, error: null });
};

exports.setCourseBurnPercent = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.tokenName == undefined ||
    req.body.tokenName == "" ||
    req.body.burnPercent == undefined ||
    req.body.burnPercent == ""
  ) {
    console.error("Bad request at adminServices.setCourseBurnPercent");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    let course = await CoursePrice.findOne({ courseId: req.body.courseId });
    let filteredTokenName = req.body.tokenName.trim().toLowerCase();
    if (!(filteredTokenName == "xdc" || filteredTokenName == "xdce")) {
      return res.json({ status: false, error: "invalid token name" });
    }
    let burnPercent = req.body.burnPercent.trim();
    if (course == null) {
      console.error(
        "Bad request at adminServices.setCourseBurnPercent, course not found"
      );
      res.json({ status: false, error: "bad request, course not found" });
      return;
    }
    // course found
    // let allBurnTokens = course.burnToken;
    let found = false;
    for (let i = 0; i < course.burnToken.length; i++) {
      if (course.burnToken[i].tokenName === filteredTokenName) {
        // found token, it exists
        found = true;
        if (course.burnToken[i].burnPercent === burnPercent) {
          // same value, bad request
          console.error(
            "Bad request at adminServices.setCourseBurnPercent, same value"
          );
          res.json({
            status: false,
            error:
              "Bad request at adminServices.setCourseBurnPercent, same value",
          });
          return;
        } else {
          // course.burnToken[i].burnPercent = burnPercent;
          await CoursePrice.update(
            {
              courseId: req.body.courseId,
              "burnToken.tokenName": filteredTokenName,
            },
            { $set: { "burnToken.$.burnPercent": burnPercent } },
            (err, course) => {
              console.log(err, course);
            }
          );
        }
      }
    }

    if (!found) {
      // new token burn addition
      course.burnToken.push({
        tokenName: filteredTokenName,
        burnPercent: burnPercent,
        autoBurn: false,
      });
    }

    await course.save();
  } catch (e) {
    console.error(
      "Some exception occured ay adminServices.setXdcConfirmation: ",
      e
    );
    res.json({ status: false, error: "internal error" });
    return;
  }
  res.json({ status: true, error: null });
};

exports.enableBurning = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.tokenName == undefined ||
    req.body.tokenName == ""
  ) {
    console.error("Bad request at adminServices.enableBurning");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    // course found

    const courseExists = await CoursePrice.findOne({
      courseId: req.body.courseId,
    });

    let filteredTokenName = req.body.tokenName.trim().toLowerCase();
    if (!(filteredTokenName == "xdce" || filteredTokenName == "xdc")) {
      return res.json({ status: false, error: "token not supported" });
    }
    if (courseExists === null) {
      return res.json({ error: "course not found", status: false });
    }
    for (let x = 0; x < courseExists.burnToken.length; x++) {
      if (
        courseExists.burnToken[x].tokenName === filteredTokenName &&
        courseExists.burnToken[x].autoBurn == true
      ) {
        return res.json({ error: "already enabled", status: false });
      }
    }

    await CoursePrice.update(
      { courseId: req.body.courseId, "burnToken.tokenName": filteredTokenName },
      { $set: { "burnToken.$.autoBurn": true } },
      (err, resp) => {
        console.log(err, resp);
        if (resp.nModified == 0) {
          return res.json({ error: "not modified", status: false });
        } else {
          res.json({ status: true, error: null });
        }
      }
    );
  } catch (e) {
    console.error(
      "Some exception occured ay adminServices.setXdcConfirmation: ",
      e
    );
    res.json({ status: false, error: "internal error" });
    return;
  }
};

exports.disableBurning = async (req, res) => {
  if (
    req.body.courseId == undefined ||
    req.body.courseId == "" ||
    req.body.tokenName == undefined ||
    req.body.tokenName == ""
  ) {
    console.error("Bad request at adminServices.disableBurning");
    res.json({ status: false, error: "bad request" });
    return;
  }

  try {
    const courseExists = await CoursePrice.findOne({
      courseId: req.body.courseId,
    });

    let filteredTokenName = req.body.tokenName.trim().toLowerCase();
    if (!(filteredTokenName == "xdce" || filteredTokenName == "xdc")) {
      return res.json({ status: false, error: "token not supported" });
    }
    if (courseExists === null) {
      return res.json({ error: "course not found", status: false });
    }
    for (let x = 0; x < courseExists.burnToken.length; x++) {
      if (
        courseExists.burnToken[x].tokenName === filteredTokenName &&
        courseExists.burnToken[x].autoBurn == true
      ) {
        return res.json({ error: "already enabled", status: false });
      }
    }
    await CoursePrice.update(
      { courseId: req.body.courseId, "burnToken.tokenName": filteredTokenName },
      { $set: { "burnToken.$.autoBurn": false } },
      (err, resp) => {
        console.log(err, resp);
        if (resp.nModified == 0) {
          return res.json({ error: "not modified", status: false });
        } else {
          res.json({ status: true, error: null });
        }
      }
    );
  } catch (e) {
    console.error(
      "Some exception occured ay adminServices.setXdcConfirmation: ",
      e
    );
    res.json({ status: false, error: "internal error" });
    return;
  }
};

// add a wallet address
exports.addWallet = async (req, res) => {
  const wallet_address = req.body.wallet_address;
  const wallet_token_name = req.body.wallet_token_name;
  const wallet_network = req.body.wallet_network;
  const wallet_purpose = req.body.wallet_purpose;
  const wallet_type = req.body.wallet_type;

  if (
    wallet_address == undefined ||
    wallet_address == null ||
    wallet_address == ""
  ) {
    return res.json({
      status: false,
      error: "bad request; invalid wallet address",
    });
  }

  if (
    wallet_token_name == undefined ||
    wallet_token_name == null ||
    wallet_token_name == ""
  ) {
    return res.json({
      status: false,
      error: "bad request; invalid wallet tokenName",
    });
  }

  if (
    wallet_network == undefined ||
    wallet_network == null ||
    wallet_network == ""
  ) {
    return res.json({
      status: false,
      error: "bad request; invalid wall;et network",
    });
  }

  if (
    wallet_purpose == undefined ||
    wallet_purpose == null ||
    wallet_purpose == ""
  ) {
    return res.json({
      status: false,
      error: "bad request; invalid wallet purpose",
    });
  }

  if (wallet_type == undefined || wallet_type == null || wallet_type == "") {
    return res.json({
      status: false,
      error: "bad request; invalid wallet type",
    });
  }

  let existingWallet = null;
  let configWallet = null;

  try {
    configWallet = await AllWallet.findOne();
  } catch (e) {
    console.error("Some error occured at adminServices.addWallet: ", e);
    return res.json({ status: false, error: "Internal Error" });
  }

  switch (wallet_type) {
    case "recipient": {
      for (let i = 0; i < configWallet.recipientWallets.length; i++) {
        if (
          wallet_address === configWallet.recipientWallets[i].wallet_address &&
          wallet_token_name ===
          configWallet.recipientWallets[i].wallet_token_name &&
          wallet_network === configWallet.recipientWallets[i].wallet_network
        ) {
          // wallet exists, return bad request
          return res.json({
            status: false,
            error: "recipient wallet already exists",
          });
        }
      }
      configWallet.recipientWallets.push({
        wallet_address: wallet_address,
        wallet_network: wallet_network,
        wallet_purpose: wallet_purpose,
        wallet_token_name: wallet_token_name,
      });
      try {
        await configWallet.save();
      } catch (err) {
        console.error("Some error occured while saving the wallet: ", e);
        return res.json({
          status: false,
          error: "internal error",
        });
      }
      return res.json({ status: true, error: null });
    }
    case "burn": {
      for (let i = 0; i < configWallet.burnWallets.length; i++) {
        if (
          wallet_address === configWallet.burnWallets[i].wallet_address &&
          wallet_token_name === configWallet.burnWallets[i].wallet_token_name &&
          wallet_network === configWallet.burnWallets[i].wallet_network
        ) {
          // wallet exists, return bad request
          return res.json({
            status: false,
            error: "burn wallet already exists",
          });
        }
      }
      configWallet.burnWallets.push({
        wallet_address: wallet_address,
        wallet_network: wallet_network,
        wallet_purpose: wallet_purpose,
        wallet_token_name: wallet_token_name,
      });
      try {
        await configWallet.save();
      } catch (err) {
        console.error("Some error occured while saving the wallet: ", e);
        return res.json({
          status: false,
          error: "internal error",
        });
      }
      return res.json({ status: true, error: null });
    }
    default: {
      return res.json({ status: false, error: "unknown wallet type" });
    }
  }
};
// switch the receipient to the given address
exports.switchWalletTo = async (req, res) => {
  /*

    1. Check if wallet exists in MongoDB
    2. Check if wallet's private key exists in the config file, if it does go ahead orelse bad request

  */
  console.log("called switch wallet to");
  const wallet_address = req.body.wallet_address;
  const wallet_type = req.body.wallet_type;
  const wallet_token_name = req.body.wallet_token_name;
  const wallet_network = req.body.wallet_network;

  if (
    wallet_address == undefined ||
    wallet_address == null ||
    wallet_address == ""
  ) {
    return res.json({
      status: false,
      error: "bad request; invalid wallet address",
    });
  }

  if (
    wallet_token_name == undefined ||
    wallet_token_name == null ||
    wallet_token_name == ""
  ) {
    return res.json({
      status: false,
      error: "bad request; invalid wallet tokenName",
    });
  }

  if (
    wallet_network == undefined ||
    wallet_network == null ||
    wallet_network == ""
  ) {
    return res.json({
      status: false,
      error: "bad request; invalid wall;et network",
    });
  }

  if (wallet_type == undefined || wallet_type == null || wallet_type == "") {
    return res.json({
      status: false,
      error: "bad request; invalid wallet type",
    });
  }

  let configWallet;
  try {
    configWallet = await AllWallet.findOne();
  } catch (e) {
    console.log(
      "Some error occured while fecthing the confgi wallet at adminServices: ",
      e
    );
    return res.json({ status: false, error: "internal error" });
  }
  if (configWallet == null) {
    return res.json({ status: false, error: "internal error" });
  }
  switch (wallet_type) {
    case "recipient": {
      console.log("in recipient");
      console.log(configWallet.recipientWallets.length);
      for (let i = 0; i < configWallet.recipientWallets.length; i++) {
        if (
          configWallet.recipientWallets[i].wallet_address === wallet_address &&
          wallet_token_name ===
          configWallet.recipientWallets[i].wallet_token_name &&
          wallet_network === configWallet.recipientWallets[i].wallet_network
        ) {
          // // found the wallet
          // if (KeyConfig[wallet_address] !== undefined && KeyConfig[wallet_address].privateKey === "" ){
          //   // stuff exists

          // }else{
          //   // wallet is not setup properly
          // }
          console.log("Found in recipient wallets");
          let exists = false;
          loop1: {
            for (let z = 0; z < configWallet.recipientActive.length; z++) {
              console.log("In active wallets loop");
              if (
                configWallet.recipientActive[z].wallet_network ===
                wallet_network &&
                configWallet.recipientActive[z].wallet_token_name ===
                wallet_token_name
              ) {
                exists = true;
                break loop1;
              }
            }
          }
          if (exists) {
            console.log("exists");
            try {
              // await configWallet.updateOne(
              //   {
              //     "recipientActive.wallet_network": wallet_network,
              //     "recipientActive.wallet_token_name": wallet_token_name
              //   },
              //   { $set: { "recipientActive.$.wallet_address": wallet_address } }
              // );
              for (let f = 0; f < configWallet.recipientActive.length; f++) {
                if (
                  configWallet.recipientActive[f].wallet_network ===
                  wallet_network &&
                  configWallet.recipientActive[f].wallet_token_name ===
                  wallet_token_name
                ) {
                  configWallet.recipientActive[
                    f
                  ].wallet_address = wallet_address;
                  configWallet.markModified("recipientActive");
                  await configWallet.save();
                  return res.json({ error: null, status: true });
                }
              }
            } catch (e) {
              console.error(
                "some error occured while updating the active account: ",
                e
              );
              return res.json({ error: "internal error", status: false });
            }
          } else {
            // add a new wallet
            console.log("new wallet");
            try {
              configWallet.recipientActive.push({
                wallet_address: wallet_address,
                wallet_network: wallet_network,
                wallet_purpose: configWallet.recipientWallets[i].wallet_purpose,
                wallet_token_name: wallet_token_name,
              });
              await configWallet.save();
            } catch (e) {
              console.error(
                "Some error occured while adding new wallet to recipientActive at adminServices.switchWalletTo: ",
                e
              );
              return res.json({ error: "internal error", status: false });
            }
            return res.json({ error: null, status: true });
          }
        }
      }
      break;
    }
    case "burn": {
      console.log("inside burn");
      for (let i = 0; i < configWallet.burnWallets.length; i++) {
        if (
          configWallet.burnWallets[i].wallet_address === wallet_address &&
          wallet_token_name === configWallet.burnWallets[i].wallet_token_name &&
          wallet_network === configWallet.burnWallets[i].wallet_network
        ) {
          // found the wallet
          console.log("found the wallet");
          let walletPKExists = false;
          if (wallet_address.slice(0, 3) == "xdc") {
            // is an XDC wallet;
            console.log("XDC wallet");
            walletPKExists =
              KeyConfig["0x" + wallet_address.slice(3)] !== undefined &&
              KeyConfig["0x" + wallet_address.slice(3)].privateKey !== "";
          } else {
            walletPKExists =
              KeyConfig[wallet_address] !== undefined &&
              KeyConfig[wallet_address].privateKey !== "";
          }
          console.log(KeyConfig[wallet_address]);
          if (walletPKExists) {
            // stuff exists
            console.log("Stuff exists in the KeyConfig");

            let exists = false;
            loop1: {
              for (let z = 0; z < configWallet.burnActive.length; z++) {
                if (
                  configWallet.burnActive[z].wallet_network ===
                  wallet_network &&
                  configWallet.burnActive[z].wallet_token_name ===
                  wallet_token_name
                ) {
                  exists = true;
                  break loop1;
                }
              }
            }
            if (exists) {
              try {
                // await configWallet.burnActive.updateOne(
                //   {
                //     wallet_network: wallet_network,
                //     wallet_token_name: wallet_token_name
                //   },
                //   { $set: { wallet_address: wallet_address } }
                // );
                for (let f = 0; f < configWallet.burnActive.length; f++) {
                  if (
                    configWallet.burnActive[f].wallet_network ===
                    wallet_network &&
                    configWallet.burnActive[f].wallet_token_name ===
                    wallet_token_name
                  ) {
                    configWallet.burnActive[f].wallet_address = wallet_address;
                    configWallet.markModified("burnActive");
                    await configWallet.save();
                    return res.json({ error: null, status: true });
                  }
                }
              } catch (e) {
                console.error(
                  "some error occured while updating the active account: ",
                  e
                );
                return res.json({ error: "internal error", status: false });
              }
              return res.json({ error: null, status: true });
            } else {
              // add a new wallet
              try {
                configWallet.burnActive.push({
                  wallet_address: wallet_address,
                  wallet_network: wallet_network,
                  wallet_purpose: configWallet.burnWallets[i].wallet_purpose,
                  wallet_token_name: wallet_token_name,
                });
                await configWallet.save();
              } catch (e) {
                console.error(
                  "Some error occured while adding new wallet to burnActive at adminServices.switchWalletTo: ",
                  e
                );
                return res.json({ error: "internal error", status: false });
              }
              return res.json({ error: null, status: true });
            }
          } else {
            // wallet is not setup properly
            return res.json({
              error: "please add privateKey in KeyConfig",
              status: false,
            });
          }
        }
      }
      break;
    }
  }
};

exports.initiateWalletConfig = async () => {
  try {
    const configWallet = await AllWallet.find({});
    if (configWallet.length > 1) {
      console.error("More than one wallet configs, please delete one");
    }
    if (configWallet.length == 0) {
      // called first time, add new wallet.
      let newWallet = new AllWallet({
        recipientWallets: [],
        burnWallets: [], // corresponding private key needs to be present in the server/config/config.js file
        recipientActive: [],
        burnActive: [],
      });
      await newWallet.save();
      console.log("Wallet initiated, please add some data");
      return;
    }
  } catch (e) {
    console.error(
      "Some error occured at adminServices.initiateWalletConfig: ",
      e
    );
    return;
  }
};

exports.addNotification = async (req, res) => {
  const email = req.body.email;
  const eventName = req.body.eventName;
  const eventId = req.body.eventId;
  const type = req.body.type;
  const title = req.body.title;
  const message = req.body.message;
  const displayed = req.body.displayed;
  const sendAll = req.body.sendAll == "true";

  const newNoti = newDefNotification();
  newNoti.email = email;
  newNoti.eventName = eventName;
  newNoti.eventId = eventId;
  newNoti.type = type;
  newNoti.title = title;
  newNoti.message = message;
  newNoti.displayed = displayed;
  newNoti.sendAll = sendAll;
  try {
    await newNoti.save();
  } catch (e) {
    console.error(
      `Some error occured while saving the notification schema at adminServices.addNotification: ${ e }`
    );
    return res.json({ status: false, error: "Internal Error" });
  }
  return res.json({ status: true, error: null });
};

exports.addReferralCode = async (req, res) => {
  console.log("Called Referral Code");
  const codeName = req.body.referralCode;
  const purpose = req.body.purpose;
  const referrerEmail = req.body.referrerEmail;

  if (
    codeName == undefined ||
    codeName == null ||
    codeName == "" ||
    purpose == undefined ||
    purpose == null ||
    purpose == ""
  ) {
    // bad request
    return res.json({ error: "bad request", status: false });
  }

  const newRefCode = newReferralCode();
  newRefCode.referralCode = codeName;
  newRefCode.purpose = purpose;
  newRefCode.referrerEmail = referrerEmail;
  newRefCode.created = Date.now();
  newRefCode.lastUsed = "";
  try {
    await newRefCode.save();
  } catch (e) {
    console.error(
      "Some error occured while saving the newRefCode at adminServices.addReferralCode: ",
      e
    );
    return res.json({ status: false, error: "internal error" });
  }
  return res.json({ status: true, error: null });
};

exports.enableRefCode = async (req, res) => {
  console.log("Called Enable Ref Code");
  const codeName = req.body.referralCode;

  if (codeName == undefined || codeName == null || codeName == "") {
    return res.json({ error: "bad request", status: false });
  }

  try {
    const refCode = await ReferralCode.findOne({ referralCode: codeName });
    if (refCode == null) {
      return res.json({ error: "no such referral code exists", status: false });
    }
    if (refCode.status) {
      return res.json({ error: "already enabled", status: false });
    }
    refCode.status = true;
    await refCode.save();
    return res.json({ error: null, status: true });
  } catch (e) {
    console.error("Some error occured at adminServices.enableRefCode: ", e);
    return res.json({ erorr: "internal error", status: false });
  }
};

exports.disableRefCode = async (req, res) => {
  console.log("Called Enable Ref Code");
  const codeName = req.body.referralCode;

  if (codeName == undefined || codeName == null || codeName == "") {
    return res.json({ error: "bad request", status: false });
  }

  try {
    const refCode = await ReferralCode.findOne({ referralCode: codeName });
    if (refCode == null) {
      return res.json({ error: "no such referral code exists", status: false });
    }
    if (!refCode.status) {
      return res.json({ error: "already disabled", status: false });
    }
    refCode.status = false;
    await refCode.save();
    return res.json({ error: null, status: true });
  } catch (e) {
    console.error("Some error occured at adminServices.disableRefCode: ", e);
    return res.json({ erorr: "internal error", status: false });
  }
};

exports.approveFund = async (req, res) => {
  try {
    const fundId = req.body.fundId;
    if (_.isEmpty(fundId)) {
      return res.json({ status: false, error: "missing parameter" });
    }
    const fundReq = await UserFundRequest.findOne({ fundId: fundId });
    if (fundReq === null) {
      return res.json({ status: false, error: "fund not found" });
    }
    if (
      fundReq.approvalRequired !== true ||
      fundReq.valid === true ||
      fundReq.status === "completed"
    ) {
      return res.json({ status: false, error: "bad request" });
    }
    fundReq.approvalRequired = false;
    fundReq.valid = true;
    await fundReq.save();
    return res.json({ status: true, message: "fund request approved" });
  } catch (e) {
    console.log(`exception at ${ __filename }.approveFund: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.rejectFund = async (req, res) => {
  try {
    const fundId = req.body.fundId;
    if (_.isEmpty(fundId)) {
      return res.json({ status: false, error: "missing parameter" });
    }
    const fundReq = await UserFundRequest.findOne({ fundId: fundId });
    if (fundReq === null) {
      return res.json({ status: false, error: "fund not found" });
    }
    if (fundReq.valid === false || fundReq.status === "completed") {
      return res.json({ status: false, error: "bad request" });
    }
    fundReq.valid = false;
    await fundReq.save();
    return res.json({ status: true, message: "fund request removed" });
  } catch (e) {
    console.log(`exception at ${ __filename }.rejectFund: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

//--------------------------------------Getters Start----------------------------------------

exports.getPromoCodeLogs = async (req, res) => {
  try {
    const promoCodeLogs = await PromoCodeLog.find({}).lean();
    res.json({ status: true, error: null, logs: promoCodeLogs });
  } catch (e) {
    console.error("error at adminServices.getPromoCodeLogs");
    console.error(e);
    res.status(500).json({ status: false, error: "internal error" });
  }
};

exports.getBurnLogs = async (req, res) => {
  try {
    const burnLogs = await BurnLog.find({}).lean();
    res.json({ status: true, error: null, logs: burnLogs });
  } catch (e) {
    console.error("error at adminServices.getBurnLogs");
    console.error(e);
    res.status(500).json({ status: false, error: "internal error" });
  }
};

exports.getPaymentLogs = async (req, res) => {
  console.log("called payment logs");
  try {
    let retData = [];
    const paymentLogs = await PaymentLog.find({});
    for (let x = 0; x < paymentLogs.length; x++) {
      const currData = {
        email: paymentLogs[x].email,
        course_id: paymentLogs[x].course_id,
        payment_id: paymentLogs[x].payment_id,
        payment_status: paymentLogs[x].payment_status,
        timestamp: paymentLogs[x]._id.getTimestamp(),
        payment_amount: paymentLogs[x].payment_amount,
        promoCode: paymentLogs[x].promoCode,
      };
      retData.push(currData);
    }
    res.json({ status: true, error: null, logs: retData });
  } catch (e) {
    console.error("error at adminServices.getPaymentLogs");
    console.error(e);
    res.status(500).json({ status: false, error: "internal error" });
  }
};

exports.getCryptoLogs = async (req, res) => {
  console.log("called getCryptoLogs");
  try {
    const cryptoLogs = await CryptoLog.find({}).lean();
    res.json({ status: true, logs: cryptoLogs });
  } catch (e) {
    console.log("exception while fetching the crypto logs: ", e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.getSocialPostTemplates = async (req, res) => {
  console.log("called getSocialPostTemplates");
  try {
    const templates = await SocialPostTemplates.find({});
    res.json({ status: true, templates: templates });
  } catch (e) {
    console.error("errot at adminServices.getSocialPostTemplates: ", e);
    return res.status(500).json({ status: false, error: "internal error" });
  }
};

exports.forcePendingBurn = (req, res) => {
  console.log(`called burnPending`);
  try {
    pendingEmitter.emit("initiatePendingBurn");
    res.status(200).json({ status: true });
  } catch (e) {
    console.log("error: ", e);
    return res.status(500).json({ status: false, error: "internal error" });
  }
};

exports.getAllFundRequests = async (req, res) => {
  try {
    const allFund = await UserFundRequest.find({})
      .select({
        receiveAddrPrivKey: 0,
      })
      .lean();
    res.json({ status: true, data: allFund });
  } catch (e) {
    console.log(`exception at $${ __filename }.getAllFundRequests: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.syncRecipients = (req, res) => {
  try {
    DonationListener.em.emit("syncRecipients");
    res.json({ status: true });
  } catch (e) {
    console.log(`exception at ${ __filename }.syncRecipients: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.syncPendingBurnFMD = async (req, res) => {
  try {
    console.log(req.body);
    let burnAll = req.body.burnAll;
    console.log(burnAll, burnAll == "true");

    pendingEmitter.emit("syncPendingBurnFMD", burnAll == "true");
    res.json({ status: true });
  } catch (e) {
    console.log(`exception at ${ __filename }.syncPendingBurnFMD: `, e);
    return res.json({ status: false });
  }
};

exports.logFMDPk = async (req, res) => {
  try {
    const addr =
      req.body.address || "xdc442b9C737AddB7C9eA9EF6a7630BbB0Cb5270bc2";
    if (_.isEmpty(addr)) {
      return res.json({ status: false, error: "missing parameter(s)" });
    }
    const fundReq = await UserFundRequest.findOne({ receiveAddr: addr });
    if (fundReq === null) {
      console.log("[*] fmd not found");
      return res.json({ status: false });
    } else {
      console.log(`PK: ${ fundReq.receiveAddrPrivKey }`);
      return res.json({ status: true });
    }
  } catch (e) {
    console.log(`[*] exception at ${ __filename }.logFMDPk: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.syncPendingDonation = async (req, res) => {
  try {
    DonationListener.em.emit("syncPendingDonation");
    res.json({ status: true });
  } catch (e) {
    console.log(`exception at ${ __filename }.syncPendingDonation: `, e);
    return res.json({ status: false, error: "internal error" });
  }
};

exports.createUserReferralAll = (req, res) => {
  try {
    referralEmitter.emit("createReferralAllUser");
    res.json({ status: true });
  } catch (e) {
    console.log(`exception at ${ __filename }.createUserReferralAll: `, e);
    res.json({ status: false });
  }
};

exports.getReferredByUser = async (req, res) => {
  try {
    const email = req.body.email;
    const userReferral = await UserReferral.findOne({ email: email });
    if (userReferral === null) {
      return res.json({ status: false });
    }
    res.json({
      status: true,
      data: {
        count: userReferral.registrations.length,
        users: userReferral.registrations,
      },
    });
  } catch (e) {
    console.log(`exception at ${ __filename }.createUserReferralAll: `, e);
    res.json({ status: false });
  }
};

exports.syncFunderCerti = async (req, res) => {
  try {
    // const rewrite = req.body.rewrite;
    const allFundReq = await UserFundRequest.find({
      $and: [
        { status: "completed" },
        {
          $and: [
            { donerName: { $ne: null } },
            { donerName: { $ne: undefined } },
            { donerName: { $ne: "" } },
          ],
        },
      ],
    }).lean();
    allFundReq.forEach((currFundReq) => {
      renderFunderCerti(currFundReq.donerName, currFundReq.fundId).catch(
        (e) => {
          console.log(`exception at ${ __filename }.syncFunderCerti: `, e);
        }
      );
    });
    res.json({ status: true });
  } catch (e) {
    console.log(`exception at ${ __filename }.syncFunderCerti: `, e);
    return res.json({ status: false, error: "internal error" });
  }
};

exports.transferFMDFundToAdmin = async (req, res) => {
  try {
    console.log("called transferFMDFundToAdmin: ", req.body);
    const { fundId, all } = req.body;
    if (fundId === undefined && all === undefined) {
      return res.json({ status: false, error: "missing parameter" });
    }
    const walletKeys = Object.keys(KeyConfig);
    let to = null;
    for (let i = 0; i < walletKeys.length; i++) {
      if (
        KeyConfig[walletKeys[i]].wallet_network === "50" &&
        KeyConfig[walletKeys[i]].wallet_type === "burn"
      ) {
        to = walletKeys[i];
        break;
      }
    }
    if (to === null) {
      return res.json({ status: true, error: "burn wallet not found" });
    }
    if (to.startsWith("0x")) {
      to = "xdc" + to.slice(2);
    }
    if (!_.isEmpty(fundId)) {
      const fund = await UserFundRequest.findOne({ fundId: fundId });
      if (fund === null) {
        return res.json({ status: false, error: "fund not found" });
      }
      let balance = await getBalance(fund.receiveAddr);
      balance = parseFloat(balance);
      if (balance < 1000000000000000000) {
        res.json({
          status: false,
          error: "balance less than 1 XDC, cannot transfer",
        });
      }
      const transferAmnt = balance - Math.pow(10, 18);
      res.json({
        status: true,
        data: "Started Processing, will main on confirmation.",
      });
      const receipt = await makeValueTransferXDC(
        to,
        transferAmnt + "",
        fund.receiveAddrPrivKey
      );
      console.log("Got the receipt: ", receipt);
      emailer.sendMailInternal(
        "blockdegree-bot@blokcdegree.org",
        process.env.SUPP_EMAIL_ID,
        "Transferred FMD tokens to Wallet",
        `Hello,\n we have transfered ${ transferAmnt } tokens into the burn wallet for XDC for the fund with id ${ fundId }`
      );
    } else if (all == true) {
      let count = 0,
        totAmnt = 0;
      const allFunds = await UserFundRequest.find({ status: "completed" });
      res.json({ status: true, data: "Started processing transaction" });
      for (let i = 0; i < allFunds.length; i++) {
        const fund = allFunds[i];
        let balance = await getBalance(fund.receiveAddr);
        balance = parseFloat(balance);
        if (balance < 1000000000000000000) {
          continue;
        }
        const transferAmnt = balance - Math.pow(10, 18);
        const receipt = await makeValueTransferXDC(
          to,
          transferAmnt + "",
          fund.receiveAddrPrivKey
        );
        console.log("Got the receipt: ", receipt);
        count++;
        totAmnt += transferAmnt;
      }
      emailer.sendMailInternal(
        "blockdegree-bot@blokcdegree.org",
        process.env.SUPP_EMAIL_ID,
        "Transferred FMD tokens to Wallet",
        `Hello,\n we have transfered ${ count } FMDs into the burn wallet for XDC, total amount ${ totAmnt } XDC.`
      );
    } else {
      return res.json({ status: false, error: "bad request" });
    }
  } catch (e) {
    console.log(`exception at ${ __filename }.transferFMDFundToAdmin: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.syncCompletionDateFMD = async (req, res) => {
  try {
    console.log("called syncCompletionDateFMD");

    const { overwrite } = req.body;
    const completedFunds = await UserFundRequest.find({ status: "completed" });
    let count = 0;
    if (completedFunds !== null)
      for (let i = 0; i < completedFunds.length; i++) {
        const fund = completedFunds[i];
        if (overwrite === true) {
          if (
            fund.fundTx == undefined ||
            fund.fundTx == "" ||
            fund.fundTx == null
          ) {
            // paypal / razorpay stuff, set it same as creation date
            completedFunds[i]["completionDate"] = fund.createdAt;
            await completedFunds[i].save();
            count++;
            continue;
          }
        } else continue;
        const timestamp = await getTransactionTimestamp(fund.fundTx);
        if (overwrite === true) {
          completedFunds[i]["completionDate"] = timestamp;
          count++;
        } else {
          if (
            fund["completionDate"] == undefined ||
            fund["completionDate"] == "" ||
            fund["completionDate"] == null
          ) {
            completedFunds[i]["completionDate"] = timestamp;
            count++;
          }
        }
        await completedFunds[i].save();
      }
    res.json({ status: true, data: `synced ${ count } completion dates.` });
  } catch (e) {
    console.log(`exception at ${ __filename }.syncCompletionDateFMD: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.setFMDCompletionDateManual = async (req, res) => {
  try {
    const { timestamp, fundId } = req.body;
    const fund = await UserFundRequest.findOne({ fundId: fundId });
    if (fund === null) {
      return res.json({ status: false, error: "fund not found" });
    }
    fund["completionDate"] = timestamp;
    await fund.save();
    res.json({ status: true, data: "CompletionDate updated" });
  } catch (e) {
    console.log(`exception at ${ __filename }.setFMDCOmpletionDateManual: `, e);
    return res.json({ status: false, error: "internal error" });
  }
};

exports.addComputingQuestions = async (req, res) => {
  try {
    const questions = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../config/computingQuestions.json"),
        "utf8"
      )
    );
    const arr = questions["questionsCloud"];
    const question = await Questions.findOne({ exam: "firstExam" });
    console.log(question["questionsComputing"]);

    if (
      question["questionsComputing"] !== undefined &&
      question["questionsComputing"].length !== 0
    ) {
      return res.json({ status: false, error: "already added" });
    }
    for (let i = 0; i < arr.length; i++) {
      question["questionsComputing"].push(arr[i]);
    }
    await question.save();
    res.json({ status: true });
  } catch (e) {
    console.log(`computing questions: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.getKycUser = async (req, res) => {
  try {
    const getKycUser = await kycDetails.find({}).lean();
    res.status(200).json({ data: getKycUser, status: 200 });
  } catch (error) {
    res.json({
      error: "Error while fetching data",
      status: 400,
    });
  }
};

exports.approveKycUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await kycDetails.findOneAndUpdate(email, {
      $set: {
        isSubmitted: true, isKycVerified: true, kycStatus: "approved"
      },
    });
    return res.json({
      message: "User Kyc Approved",
      status: 200,
    });
  } catch (error) {
    return res.json({
      error: "Went Something Wrong",
      status: 422,
    });
  }
};

exports.rejectKycUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await kycDetails.findOneAndUpdate(email, {
      $set: {
        isSubmitted: false, isKycVerified: false, kycStatus: "rejected"
      },
    });
    return res.json({
      message: "User Kyc Rejected",
      status: 200,
    });
  } catch (error) {
    return res.json({
      error: "Went Something Wrong",
      status: 422,
    });
  }
};

exports.getrazorpaylog = async (req, res) => {
  try {
    const logs = await razorpaylog.find({}).lean();
    if (!logs.length) {
      res.status(422).json({
        error: "No Data Available",
        status: 422,
      });
    } else {
      res.status(200).json({
        message: "Got Razor pay log",
        data: logs,
        status: 200
      });
    }
  } catch (error) {
    res.status(422).json({
      error: "Went Something Wrong",
      status: 422,
    });
  }
};

exports.getuserreferals = async (req, res) => {
  try {
    const userRef = await userReferral.find({}).lean();
    if (!userRef.length) {
      res.status(422).json({
        error: "No Data Available",
        status: 422,
      });
    } else {
      res.status(200).json({
        message: "Got User referal",
        data: userRef,
        status: 200
      });
    }
  } catch (error) {
    res.status(422).json({
      error: "Went Something Wrong",
      status: 422,
    });
  }
};
exports.getfundmydegree = async (req, res) => {
  try {
    const userFund = await userFundRequest.find({}).select({ receiveAddrPrivKey: 0 }).lean();
    if (!userFund.length) {
      res.status(422).json({
        error: "No Data Available",
        status: 422,
      });
    } else {
      res.status(200).json({
        message: "Got Fund My Degree",
        data: userFund,
        status: 200
      });
    }
  }
  catch (error) {
    res.status(422).json({
      error: "Went Something Wrong",
      status: 422,
    });
  }
};

exports.getKycUserPic = (req, res) => {
  res.sendFile(req.params.path);
};

exports.getSocialShares = async (req, res) => {
  try {
    const allShares = await SocialShare.find({}).lean();
    res.json({ status: true, data: allShares });
  } catch (e) {
    console.log(`exeption at ${ __filename }.getSocialShares: `, e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const userSessions = await UserSessions.find({}).lean();
    res.json({ status: true, data: userSessions });
  } catch (e) {
    console.log(e);
    res.json({ status: false, error: "internal error" });
  }
};

exports.setVideoSessions = async (req, res) => {
  try {
    const userSession = await UserSessions.findOne({ email: req.user.email }).sort({ createdAt: -1 });
    await new examSession({
      email: req.user.email,
      examId: uuidv4(),
      sessionId: userSession.sessionId,
      courseId: req.body.courseId
    }).save();
    res.status(200).json({ status: 200, message: "Video Session Time Set" });
  } catch (error) {
    console.error('Error:::', error);
    res.status(422).json({ message: "Something Wrong" });
  }
};

//--------------------------------------Getters Stop----------------------------------------

function newDefCourse(courseId) {
  return new CoursePrice({
    courseId: courseId,
    courseName: "",
    xdceTolerance: "",
    xdceConfirmation: "",
    xdcTolerance: "",
    xdcConfirmation: "",
    priceUsd: "",
    burnToken: [],
  });
}

function newDefNotification() {
  return new Notification({
    email: "",
    eventName: "",
    eventId: "",
    type: "",
    title: "",
    message: "",
    displayed: "",
    emails: [],
    sendAll: false,
  });
}

function newReferralCode() {
  return ReferralCode({
    referralCode: "",
    purpose: "",
    status: false,
    count: 0,
    users: [],
    created: "",
    lastUsed: "",
    referrerEmail: "",
  });
}
