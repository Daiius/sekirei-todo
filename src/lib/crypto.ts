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


/**
 * パスフレーズから暗号化キーを生成します
 */
export async function deriveKey(
  passPhrase: string, 
  iterations: number = 1000,
  length: number = 256,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', 
    new TextEncoder().encode(passPhrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey({
    name: 'PBKDF2',
    hash: 'SHA-512',
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
  const cipherText = await crypto.subtle.encrypt({
    name: 'AES-GCM',
  }, key, encoder.encode(planText));

  return cipherText;
}

/**
 * 暗号化キーを用いてテキストを復号します
 */
export async function decrypt(key: CryptoKey, cipherText: ArrayBuffer) {
  const plainText = await crypto.subtle.decrypt({
    name: 'AES-GCM',
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
  return arrayBufferToBase64(
    await crypto.subtle.digest(
      'SHA-512',
      // 果たしてsalt文字列はappendするので良いのかは疑問がある
      // ハッシュ関数の素性が良ければこれで十分だろうか...
      new TextEncoder().encode(text + salt)
    )
 );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

