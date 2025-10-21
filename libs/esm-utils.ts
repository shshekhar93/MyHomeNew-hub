import { readFile } from 'fs/promises';

export const RootURL = new URL(
  process.env.NODE_ENV === 'production' ? '../../' : '../',
  import.meta.url,
);

export async function getFirmwareFile(hardwareVer: string) {
  return readFile(
    new URL(`./firmwares/${hardwareVer}.latest`, RootURL),
    'utf8',
  );
}

export async function getManifestFile() {
  return readFile(new URL('./app/manifest.json', RootURL), 'utf8');
}

export function getAppFullURL(fileName: string) {
  return new URL(`./app/${fileName}`, RootURL);
}

export function getTranslationFileURL(file: string) {
  return new URL(`./translations/${file}`, RootURL);
}

export function getFileURL(fileRelativeToProjectRoot: string) {
  return new URL(`./${fileRelativeToProjectRoot}`, RootURL);
}
