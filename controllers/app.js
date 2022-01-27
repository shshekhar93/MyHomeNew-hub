'use strict';

const path = require('path');
const { logError } = require('../libs/logger');
const fs = require('fs').promises;

const APK_REGEX = /^myhomenew-app-\d+\.\d+\.\d+.apk$/i;

async function appManifest(req, res) {
    try {
        const manifestStr = await fs.readFile(path.join(__dirname, '../app/manifest.json'), 'utf8');
        const manifest = JSON.parse(manifestStr);
        res.json(manifest);
    }
    catch(e) {
        logError('Manifest doesnot exist');
        logError(e);
        res.json({});
    } 
}

async function downloadApp(req, res) {
    const fileName = req.params.apk;
    if(!APK_REGEX.test(fileName)) {
        return res.status(403).end();
    }

    const fullPath = path.join(__dirname, `../app/${fileName}`);
    try {
        await fs.stat(fullPath)
    }
    catch(e) {
        return res.status(404).end();
    }

    res.sendFile(fullPath);
}

module.exports = {
    appManifest,
    downloadApp
};
