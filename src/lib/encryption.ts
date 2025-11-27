import * as sodium from 'libsodium-wrappers';

// Initialize libsodium
await sodium.ready;

export interface EncryptedMessage {
  ciphertext: string;  // base64 encoded
  nonce: string;       // base64 encoded
  publicKey: string;   // sender's public key (base64)
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Generate a new key pair for encryption
 */
export async function generateKeyPair(): Promise<KeyPair> {
  await sodium.ready;
  const keypair = sodium.crypto_box_keypair();
  return {
    publicKey: keypair.publicKey,
    privateKey: keypair.privateKey
  };
}

/**
 * Encrypt a message for a specific recipient
 */
export async function encryptMessage(
  message: string,
  recipientPublicKey: Uint8Array,
  privateKey: Uint8Array
): Promise<EncryptedMessage> {
  await sodium.ready;
  
  // Generate a nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  
  // Encrypt the message
  const ciphertext = sodium.crypto_box_easy(
    message,
    nonce,
    recipientPublicKey,
    privateKey
  );

  // Generate the sender's public key from the private key
  const publicKey = sodium.crypto_scalarmult_base(privateKey);

  return {
    ciphertext: sodium.to_base64(ciphertext),
    nonce: sodium.to_base64(nonce),
    publicKey: sodium.to_base64(publicKey)
  };
}

/**
 * Decrypt a message
 */
export async function decryptMessage(
  encrypted: EncryptedMessage,
  privateKey: Uint8Array,
  senderPublicKey: Uint8Array
): Promise<string> {
  await sodium.ready;

  try {
    const decrypted = sodium.crypto_box_open_easy(
      sodium.from_base64(encrypted.ciphertext),
      sodium.from_base64(encrypted.nonce),
      senderPublicKey,
      privateKey
    );

    return sodium.to_string(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Convert a base64 public key to Uint8Array
 */
export function publicKeyFromBase64(publicKey: string): Uint8Array {
  return sodium.from_base64(publicKey);
}

/**
 * Convert a base64 private key to Uint8Array
 */
export function privateKeyFromBase64(privateKey: string): Uint8Array {
  return sodium.from_base64(privateKey);
}

/**
 * Convert a key pair to base64 strings for storage
 */
export function keyPairToBase64(keyPair: KeyPair): { publicKey: string; privateKey: string } {
  return {
    publicKey: sodium.to_base64(keyPair.publicKey),
    privateKey: sodium.to_base64(keyPair.privateKey)
  };
}

/**
 * Convert base64 strings back to a key pair
 */
export function keyPairFromBase64(keys: { publicKey: string; privateKey: string }): KeyPair {
  return {
    publicKey: sodium.from_base64(keys.publicKey),
    privateKey: sodium.from_base64(keys.privateKey)
  };
}
