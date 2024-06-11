/**
 * @jest-environment node
 */

import { encrypt, decrypt, deriveKey } from './crypto';

describe('ハッシュ・暗号化機能のテスト', () => {
  it('暗号化・復号化のテスト', async () => {
    const originalText = 'secret text';
    const key = await deriveKey('passPhrase');
    const cipherText = await encrypt(key, originalText);
    const decryptedText = await decrypt(key, cipherText);

    expect(decryptedText).toMatch(originalText);
  });
});
