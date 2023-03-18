import { stat } from 'fs/promises';
import { getAppFullURL, getManifestFile } from '../../libs/esm-utils';
import { generateExpressRequestMocks } from '../../test/test-utils';
import { appManifest, downloadApp } from '../app';

jest.mock('../../libs/esm-utils');
jest.mock('fs/promises', () => ({
  stat: jest.fn(),
}));

describe('Phone app controller', () => {
  const mockManifest = {
    version: '0.0.1',
  };

  it('Should return manifest', async () => {
    const [req, res] = generateExpressRequestMocks();
    getManifestFile.mockReturnValueOnce(
      Promise.resolve(JSON.stringify(mockManifest))
    );
    await appManifest(req, res);
    expect(res.json).toHaveBeenCalledWith(mockManifest);
  });

  it('Should gracefully handle failures', async () => {
    const [req, res] = generateExpressRequestMocks();
    getManifestFile.mockReturnValueOnce(Promise.resolve('{'));
    await appManifest(req, res);
    expect(res.json).toHaveBeenCalledWith({});
  });

  it('Should return app apk', async () => {
    const mockAPKPath = '../test/myhome-new.apk';
    const [req, res] = generateExpressRequestMocks();
    getAppFullURL.mockReturnValueOnce({ pathname: mockAPKPath });

    req.params = { apk: 'myhomenew-app-0.0.1.apk' };
    await downloadApp(req, res);
    expect(res.sendFile).toHaveBeenCalledWith(mockAPKPath);
  });

  it('Should fail for invalid apk name', async () => {
    const [req, res] = generateExpressRequestMocks();
    req.params = { apk: 'myhomenew-app-private.apk' };
    await downloadApp(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.end).toHaveBeenCalled();
  });

  it('Should fail if file does not exist', async () => {
    const mockAPKPath = '../test/myhome-new.apk';
    const [req, res] = generateExpressRequestMocks();
    getAppFullURL.mockReturnValueOnce({ pathname: mockAPKPath });
    stat.mockReturnValueOnce(Promise.reject(new Error('File does not exist')));

    req.params = { apk: 'myhomenew-app-0.0.1.apk' };
    await downloadApp(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.end).toHaveBeenCalled();
  });
});
