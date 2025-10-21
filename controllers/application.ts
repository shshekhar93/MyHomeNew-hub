import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import memoize from 'memoizee';
import { getTranslationFileURL } from '../libs/esm-utils.js';
import type { Request, Response } from 'express';

async function exists(url: string | URL) {
  try {
    await stat(url);
    return true;
  }
  catch (_) {
    return false;
  }
}

async function findFirst<T>(arr: T[], predicate: (i: T) => Promise<boolean>): Promise<T | undefined> {
  for (let i = 0; i < arr.length; i++) {
    if (await predicate(arr[i]!)) {
      return arr[i];
    }
  }
}

const translationsURL = memoize(
  async (locale = 'en') => {
    const [lang, country] = locale.split(/[_-]/);

    return await findFirst(
      [`${lang}-${country}.json`, `${lang}.json`, 'en.json'].map(file =>
        getTranslationFileURL(file),
      ),
      exists,
    );
  },
  {
    length: 1,
    promise: true,
  },
);

const serveTranslations = async (req: Request, res: Response) => {
  const url = await translationsURL(req.query.locale);
  res.type('json');
  return createReadStream(url!).pipe(res);
};

export { serveTranslations };
