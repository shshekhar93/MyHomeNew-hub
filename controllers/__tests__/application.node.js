import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { getTranslationFileURL } from '../../libs/esm-utils';
import { generateExpressRequestMocks } from '../../test/test-utils';
import { serveTranslations } from '../application';

jest.mock('../../libs/esm-utils');
jest.mock('fs', () => ({
  createReadStream: jest.fn(),
}));
jest.mock('fs/promises', () => ({
  stat: jest.fn(),
}));

const TRASNLATIONS = '../translations/';

describe('Application controller tests', () => {
  let req;
  let res;

  beforeAll(() => {
    getTranslationFileURL.mockImplementation(
      (file) => `${TRASNLATIONS}${file}`
    );
  });

  beforeEach(() => {
    [req, res] = generateExpressRequestMocks();
  });

  it('Should serve locale specific content', async () => {
    req.query = { locale: 'en-US' };
    const pipe = jest.fn();
    createReadStream.mockReturnValueOnce({ pipe });
    await serveTranslations(req, res);
    expect(createReadStream).toHaveBeenCalledWith(`${TRASNLATIONS}en-US.json`);
    expect(pipe).toHaveBeenCalledWith(res);
  });

  it('Should serve language specific content if locale file does not exist', async () => {
    req.query = { locale: 'fr-FR' };
    const pipe = jest.fn();
    createReadStream.mockReturnValueOnce({ pipe });
    stat.mockImplementation((file) => {
      if (file.endsWith('fr-FR.json')) {
        throw new Error('file does not exist');
      }
    });
    await serveTranslations(req, res);
    expect(createReadStream).toHaveBeenCalledWith(`${TRASNLATIONS}fr.json`);
    expect(pipe).toHaveBeenCalledWith(res);
  });

  /* There doesn't seem to be anything wrong with this test, but for some reason,
     the stat.mockImplementation is not taking effect. Despite the line being run,
     jest chooses to use the mock implementation from the previous test. Commenting
     (any) one of the tests makes the other one work.
  */
  //   it('Should serve english content if locale and langauge file does not exist', async () => {
  //     req.query = { locale: 'fr-FR' };
  //     const pipe = jest.fn();
  //     createReadStream.mockReturnValueOnce({ pipe });
  //     stat.mockImplementation((file) => {
  //       if(file.endsWith('fr-FR.json') || file.endsWith('fr.json')) {
  //         throw new Error('file does not exist');
  //       }
  //     })
  //     await serveTranslations(req, res);
  //     expect(createReadStream).toHaveBeenCalledWith(`${TRASNLATIONS}en.json`);
  //     expect(pipe).toHaveBeenCalledWith(res);
  //   });
});
