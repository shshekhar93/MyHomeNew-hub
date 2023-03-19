import { readFile } from 'fs/promises';

export async function getFirmwareFile(hardwareVer) {
  return readFile(
    new URL(`../firmwares/${hardwareVer}.latest`, import.meta.url),
    'utf8'
  );
}

export async function getManifestFile() {
  return readFile(new URL('../app/manifest.json', import.meta.url), 'utf8');
}

export function getAppFullURL(fileName) {
  return new URL(`../app/${fileName}`, import.meta.url);
}

export function getTranslationFileURL(file) {
  return new URL(`../translations/${file}`, import.meta.url);
}

export function getFirmwareFileURL(filePath) {
  return new URL(`../${filePath}`, import.meta.url);
}

export function getFileURL(fileRelativeToProjectRoot) {
  return new URL(`../${fileRelativeToProjectRoot}`, import.meta.url);
}
