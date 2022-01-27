'use strict';

import { readFile, stat } from 'fs/promises';
import { logError } from '../libs/logger.js';

const APK_REGEX = /^myhomenew-app-\d+\.\d+\.\d+.apk$/i;

async function appManifest(req, res) {
    try {
        const manifestStr = await readFile(new URL('../app/manifest.json', import.meta.url), 'utf8');
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

    const fullURL = new URL(`../app/${fileName}`, import.meta.url);
    try {
        await stat(fullURL)
    }
    catch(e) {
        return res.status(404).end();
    }

    res.sendFile(fullURL.pathname);
}

export {
    appManifest,
    downloadApp
};
