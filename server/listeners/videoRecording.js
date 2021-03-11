const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const http = require('http');
const blobUtil = require('blob-util');
const blob = require('blob');
const ExamSession = require('../models/examSession');

exports.videoRecording = async (req, res) => {
    try {
        let currentPath = path.join(__dirname, '../../src/videoRecord/');
        const name = req.user.name.split(' ')[0];
        const { videoConfigLink, courseName } = req.body;
        if (_.isEmpty(videoConfigLink) || _.isEmpty(courseName)) {
            res.status(500).json({
                message: "Something went Wrong ❌",
                status: 500,
            });
        } else {
            const videoPath = currentPath + courseName + "-" + Date.now() + "-" + name;
            const videoSaving = await download(videoConfigLink, videoPath);
            if (!videoSaving) {
                res.status(422).json({
                    message: "Error in video url ❌",
                    status: 422,
                });
            } else {
                await ExamSession.findOneAndUpdate({ email: req.user.email }, { $set: { videoPath, courseName } }).sort({ createdAt: -1 });
                res.status(200).json({
                    status: 200,
                    message: "Video Save & exam End ✌"
                });
            };
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Something Wrong ❌",
            status: 500,
        });
    }
};

function download(url, path) {
    try {
        const videoPath = fs.createWriteStream(path);
        // blobUtil.blobToDataURL(url).then(res => {
        // });
        console.log('..........', new Blob([url]));
        // const request = http.get(new Blob([url]), (data) => {
        //     data.pipe(videoPath);
        // });
        return request;
    } catch (error) {
        // console.error('Error::::', error);
        return null;
    }
};