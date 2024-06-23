/**
 * パスワードのSalt&Hash化や、cookieの暗号化を行う関数群
 * 参考：
 * https://nodejs.org/api/webcrypto.html#encryption-and-decryption
 *
 * 詳しい仕組みを完全に把握してはいないが、
 * 運用を簡易化するためにセキュリティが脆弱になっている部分がある
 * 1. iv (initial vector?) を使用しないため、
 *    keyが漏れればすぐ復号できる
 * 2. passPhraseにsaltを使用しないでkeyを生成するため、
 *    passPhraseが分かればすぐに復号ができてしまう
 *
 * これらの弱点の裏返しとして、
 * 1. Next.jsサーバが再起動されてもcookieの内容を復号できるため、
 *    有効期間中ならば確実に復号できる
 * というメリットがある
 */

import { subtle } from 'crypto';
import { Buffer } from 'buffer';

const iv = new TextEncoder().encode(process.env.IV_SEED!);

/**
 * パスフレーズから暗号化キーを生成します
 */
export async function deriveKey(
  passPhrase: string, 
  iterations: number = 1000,
  length: number = 256,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw', 
    encoder.encode(passPhrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await subtle.deriveKey({
    name: 'PBKDF2',
    hash: 'SHA-512',
    salt: encoder.encode(process.env.DERIVE_SALT!),
    iterations,
  }, keyMaterial, {
    name: 'AES-GCM',
    length,
  }, true, ['encrypt', 'decrypt']);

  return key;
}

/**
 * 暗号化キーを用いてテキストを暗号化します
 */
export async function encrypt(
  key: CryptoKey, 
  planText: string,
) {
  const encoder = new TextEncoder();
  const cipherText = await subtle.encrypt({
    name: 'AES-GCM',
    iv,
  }, key, encoder.encode(planText));

  return cipherText;
}

/**
 * 暗号化キーを用いてテキストを復号します
 */
export async function decrypt(key: CryptoKey, cipherText: ArrayBuffer) {
  const plainText = await subtle.decrypt({
    name: 'AES-GCM',
    iv,
  }, key, cipherText);

  return new TextDecoder().decode(plainText);
}

/**
 * textをsaltを付加してSHA-512ハッシュ化します
 */
export async function hashWithSalt(
  text: string,
  salt: string,
): Promise<string> {
  console.log('text: ', text);
  console.log('salt: ', salt);
  return Buffer.from(
    await subtle.digest(
      'SHA-512',
      // 果たしてsalt文字列はappendするので良いのかは疑問がある
      // ハッシュ関数の素性が良ければこれで十分だろうか...
      new TextEncoder().encode(text + salt)
    )
 ).toString('base64');
}

