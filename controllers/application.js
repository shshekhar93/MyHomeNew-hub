import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import memoize from 'memoizee';

async function exists(url) {
  try {
    await stat(url);
    return true;
  } catch (_) {}
  return false;
}

async function findFirst(arr, predicate) {
  for (let i = 0; i < arr.length; i++) {
    if (await predicate(arr[i])) {
      return arr[i];
    }
  }
}

const translationsURL = memoize(
  async (locale = 'en') => {
    const [lang, country] = locale.split(/[_-]/);

    return await findFirst(
      [`${lang}-${country}.json`, `${lang}.json`, 'en.json'].map(
        (file) => new URL(`../translations/${file}`, import.meta.url)
      ),
      exists
    );
  },
  {
    length: 1,
    promise: true,
  }
);

const serveTranslations = async (req, res) => {
  const url = await translationsURL(req.query.locale);
  res.type('json');
  return createReadStream(url).pipe(res);
};

export { serveTranslations };
