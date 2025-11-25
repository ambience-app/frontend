import { describe, it, expect, beforeAll } from 'vitest';
import * as sodium from 'libsodium-wrappers';
import {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
  publicKeyFromBase64,
  privateKeyFromBase64,
  keyPairToBase64,
  keyPairFromBase64,
} from '../encryption';

describe('Encryption Utilities', () => {
  // Initialize libsodium before running tests
  beforeAll(async () => {
    await sodium.ready;
  });

  describe('Key Generation', () => {
    it('should generate a valid key pair', async () => {
      const keyPair = await generateKeyPair();
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.publicKey.length).toBeGreaterThan(0);
      expect(keyPair.privateKey.length).toBeGreaterThan(0);
    });
  });

  describe('Message Encryption/Decryption', () => {
    let aliceKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array };
    let bobKeyPair: { publicKey: Uint8Array; privateKey: Uint8Array };
    const testMessage = 'Hello, secure world!';

    beforeAll(async () => {
      aliceKeyPair = await generateKeyPair();
      bobKeyPair = await generateKeyPair();
    });

    it('should encrypt and decrypt a message', async () => {
      // Alice encrypts a message for Bob
      const encrypted = await encryptMessage(
        testMessage,
        bobKeyPair.publicKey,
        aliceKeyPair.privateKey
      );

      // Bob decrypts the message
      const decrypted = await decryptMessage(
        encrypted,
        bobKeyPair.privateKey,
        aliceKeyPair.publicKey
      );

      expect(decrypted).toBe(testMessage);
    });

    it('should fail to decrypt with wrong key', async () => {
      const encrypted = await encryptMessage(
        testMessage,
        bobKeyPair.publicKey,
        aliceKeyPair.privateKey
      );

      // Try to decrypt with wrong private key (Alice's instead of Bob's)
      await expect(
        decryptMessage(encrypted, aliceKeyPair.privateKey, aliceKeyPair.publicKey)
      ).rejects.toThrow('Failed to decrypt message');
    });
  });

  describe('Key Serialization', () => {
    it('should convert key pair to and from base64', async () => {
      const keyPair = await generateKeyPair();
      const serialized = keyPairToBase64(keyPair);
      const deserialized = keyPairFromBase64(serialized);

      expect(deserialized.publicKey).toEqual(keyPair.publicKey);
      expect(deserialized.privateKey).toEqual(keyPair.privateKey);
    });

    it('should convert individual keys to and from base64', () => {
      const keyPair = sodium.crypto_box_keypair();
      const pubBase64 = sodium.to_base64(keyPair.publicKey);
      const privBase64 = sodium.to_base64(keyPair.privateKey);

      const pubRestored = publicKeyFromBase64(pubBase64);
      const privRestored = privateKeyFromBase64(privBase64);

      expect(pubRestored).toEqual(keyPair.publicKey);
      expect(privRestored).toEqual(keyPair.privateKey);
    });
  });
});
