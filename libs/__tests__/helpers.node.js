import { catchAndRespond, resp, transformer } from '../helpers.js';

function generateExpressRequestMocks() {
  const req = {};
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(),
  };
  const next = jest.fn();

  return [req, res, next];
}

describe('Helpers -- Catch and Respond tests', () => {
  const middleware = jest.fn();

  it('Should not send response if middleware succeeds', async () => {
    middleware.mockReturnValueOnce(Promise.resolve());
    const safeMiddleware = catchAndRespond(middleware);

    const [req, res, next] = generateExpressRequestMocks();
    await safeMiddleware(req, res, next);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should respond with error on promise fail', async () => {
    middleware.mockReturnValueOnce(
      Promise.reject(new Error('Middleware failed'))
    );
    const safeMiddleware = catchAndRespond(middleware);

    const [req, res, next] = generateExpressRequestMocks();
    await safeMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'Middleware failed',
    });
  });

  it('should respond with original error obj if its not Error type', async () => {
    // eslint-disable-next-line prefer-promise-reject-errors
    middleware.mockReturnValueOnce(Promise.reject('Middleware failed'));
    const safeMiddleware = catchAndRespond(middleware);

    const [req, res, next] = generateExpressRequestMocks();
    await safeMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      err: 'Middleware failed',
    });
  });

  it('should respond with just success false if no error provided', async () => {
    // eslint-disable-next-line prefer-promise-reject-errors
    middleware.mockReturnValueOnce(Promise.reject());
    const safeMiddleware = catchAndRespond(middleware);

    const [req, res, next] = generateExpressRequestMocks();
    await safeMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
    });
  });
});

describe('Helpers -- Transformers tests', () => {
  it('Should contain json and object transformers', () => {
    expect(transformer.toObject.transform).toEqual(expect.any(Function));
    expect(transformer.toJSON.transform).toEqual(expect.any(Function));
  });

  it('toObject should remove ignored keys from return val', () => {
    const mockObj = {
      key: 'value',
      __v: 0,
    };
    const result = transformer.toObject.transform(null, mockObj);
    expect(result).toStrictEqual({
      key: 'value',
    });
  });

  it('toJSON should remove ignored keys from return val', () => {
    const mockObj = {
      key: 'value',
      __v: 0,
    };
    const result = transformer.toJSON.transform(null, mockObj);
    expect(result).toStrictEqual({
      key: 'value',
    });
  });
});

describe('Helpers -- response tests', () => {
  it('Should return just success when not obj provided', () => {
    const result = resp(true);
    expect(result).toStrictEqual({
      success: true,
    });
  });
});
