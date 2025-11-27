import { mainnet } from 'viem/chains';
import { createPublicClient, http } from 'viem';

export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

export async function resolveENSName(name: string): Promise<string | null> {
  try {
    // Check if it's already an address
    if (/^0x[a-fA-F0-9]{40}$/.test(name)) {
      return name;
    }
    
    // Check if it's an ENS name (ends with .eth)
    if (name.endsWith('.eth')) {
      const address = await publicClient.getEnsAddress({
        name: name.toLowerCase()
      });
      return address;
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
}

export async function resolveAddressToENS(address: string): Promise<string | null> {
  try {
    const name = await publicClient.getEnsName({
      address: address as `0x${string}`
    });
    return name;
  } catch (error) {
    console.error('Error resolving address to ENS:', error);
    return null;
  }
}
