export const getFirmwareFile = jest.fn();
export const getManifestFile = jest.fn();
export const getAppFullURL = jest.fn();
export const getTranslationFileURL = jest.fn();
export const getFirmwareFileURL = jest.fn();
export const getFileURL = jest.fn((file) => ({
  pathname: `/path/to/${file}`,
}));
