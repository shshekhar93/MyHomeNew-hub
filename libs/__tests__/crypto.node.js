import { decrypt, encrypt, randomBytes } from '../crypto';

const TEST_KEY = 'd37f4749c02c7e454d43d9a970e55326';

describe('Crypto -- randomBytes tests', () => {
  it('Should return random bytes as string when encoding provided', async () => {
    const randomStr = await randomBytes(10, 'hex');
    expect(randomStr.length).toBe(20);
  });

  it('Should return random bytes as Buffer when encoding not provided', async () => {
    const randomStr = await randomBytes(10);
    expect(randomStr.length).toBe(10);
    expect(Buffer.isBuffer(randomStr)).toBe(true);
  });
});

describe('Crypto -- encryption tests', () => {
  it('Should encrypt and decrypt predictably', () => {
    const plainText = 'Hello world!';
    const cipherText = encrypt('Hello world!', TEST_KEY);
    const decryptedText = decrypt(cipherText, TEST_KEY, 'utf8');
    expect(decryptedText).toBe(plainText);
  });

  it('Should return Buffer is no encoding provided', () => {
    const plainText = 'Hello world!';
    const cipherText = encrypt('Hello world!', TEST_KEY);
    const decryptedBuffer = decrypt(cipherText, TEST_KEY);
    expect(Buffer.isBuffer(decryptedBuffer)).toBe(true);
    expect(decryptedBuffer.toString('utf8')).toBe(plainText);
  });
});
