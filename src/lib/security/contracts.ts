/**
 * Secure Contract Interaction System
 * Provides safe wrappers for all blockchain interactions with validation and error handling
 */

import { Address, Abi, createPublicClient, createWalletClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '@/contracts/addresses';
import { createRateLimitedFunction } from '@/utils/rateLimiter';
import { createSafeError, SafeError, ApiResponse } from '@/lib/security/errors';

// Network configuration
const SUPPORTED_NETWORKS = {
  8453: { // Base Mainnet
    name: 'base',
    chain: base,
    contracts: CONTRACT_ADDRESSES.celo // Using existing structure
  },
  84532: { // Base Sepolia
    name: 'baseSepolia', 
    chain: baseSepolia,
    contracts: CONTRACT_ADDRESSES.celoSepolia
  },
  1337: { // Localhost
    name: 'localhost',
    chain: base, // Use base as fallback
    contracts: CONTRACT_ADDRESSES.localhost
  }
} as const;

type NetworkId = keyof typeof SUPPORTED_NETWORKS;

// Security validation interfaces
export interface SecureContractCall {
  address: Address;
  abi: Abi;
  functionName: string;
  args: unknown[];
  value?: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  chainId?: NetworkId;
}

export interface SecureContractRead {
  address: Address;
  abi: Abi;
  functionName: string;
  args: unknown[];
  chainId?: NetworkId;
}

export interface ContractValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Network and contract validation
 */
export class ContractValidator {
  
  /**
   * Validate if address is a valid Ethereum address
   */
  static validateAddress(address: string | Address): boolean {
    try {
      ethereumAddressSchema.parse(address.toString());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate contract function parameters
   */
  static validateFunctionCall(call: SecureContractCall): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Address validation
    if (!this.validateAddress(call.address)) {
      errors.push('Invalid contract address');
    }

    // Function name validation
    if (!call.functionName || typeof call.functionName !== 'string') {
      errors.push('Invalid function name');
    }

    // Args validation
    if (!Array.isArray(call.args)) {
      errors.push('Args must be an array');
    }

    // Gas limit validation (prevent excessive gas usage)
    if (call.gasLimit && call.gasLimit > 10000000n) { // 10M gas limit
      warnings.push('Very high gas limit detected');
    }

    // Value validation
    if (call.value && call.value < 0n) {
      errors.push('Invalid transaction value');
    }

    // Network validation
    if (call.chainId && !SUPPORTED_NETWORKS[call.chainId]) {
      errors.push('Unsupported network');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate read-only function call
   */
  static validateReadCall(call: SecureContractRead): ContractValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Same validation as write, but no gas limits
    if (!this.validateAddress(call.address)) {
      errors.push('Invalid contract address');
    }

    if (!call.functionName || typeof call.functionName !== 'string') {
      errors.push('Invalid function name');
    }

    if (!Array.isArray(call.args)) {
      errors.push('Args must be an array');
    }

    if (call.chainId && !SUPPORTED_NETWORKS[call.chainId]) {
      errors.push('Unsupported network');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate ABI contains only safe functions
   */
  static validateAbi(abi: Abi): boolean {
    const dangerousFunctions = [
      'selfdestruct',
      'suicide',
      'delegatecall',
      'callcode'
    ];

    return !dangerousFunctions.some(dangerous => 
      abi.some(item => 
        item.type === 'function' && item.name === dangerous
      )
    );
  }
}

/**
 * Secure contract client wrapper
 */
export class SecureContractClient {
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private currentNetwork: NetworkId;

  constructor(networkId: NetworkId = 8453) { // Default to Base mainnet
    const network = SUPPORTED_NETWORKS[networkId];
    if (!network) {
      throw new Error(`Unsupported network: ${networkId}`);
    }

    this.currentNetwork = networkId;
    this.publicClient = createPublicClient({
      chain: network.chain,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo'),
      batch: {
        multicall: true,
      },
    });
  }

  /**
   * Initialize wallet client when user connects
   */
  initializeWalletClient(account: Address) {
    const network = SUPPORTED_NETWORKS[this.currentNetwork];
    this.walletClient = createWalletClient({
      chain: network.chain,
      account,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo'),
    });
  }

  /**
   * Secure contract read operation with validation
   */
  async readContract(call: SecureContractRead): Promise<ApiResponse<any>> {
    try {
      // Validate call
      const validation = ContractValidator.validateReadCall(call);
      if (!validation.isValid) {
        return createSafeError(new Error(`Validation failed: ${validation.errors.join(', ')}`));
      }

      // Execute read with error handling
      const result = await this.publicClient.readContract({
        address: call.address,
        abi: call.abi,
        functionName: call.functionName,
        args: call.args,
      });

      return { success: true, data: result };
    } catch (error) {
      return handleContractError(error, 'contract_read');
    }
  }

  /**
   * Secure contract write operation with validation and rate limiting
   */
  async writeContract(call: SecureContractCall): Promise<ApiResponse<`0x${string}`>> {
    try {
      if (!this.walletClient) {
        return createSafeError(new Error('Wallet not connected'));
      }

      // Validate call
      const validation = ContractValidator.validateFunctionCall(call);
      if (!validation.isValid) {
        return createSafeError(new Error(`Validation failed: ${validation.errors.join(', ')}`));
      }

      // Execute write with wallet
      const hash = await this.walletClient.writeContract({
        address: call.address,
        abi: call.abi,
        functionName: call.functionName,
        args: call.args,
        gas: call.gasLimit,
        gasPrice: call.gasPrice,
        value: call.value,
      });

      return { success: true, data: hash };
    } catch (error) {
      return handleContractError(error, 'contract_write');
    }
  }

  /**
   * Estimate gas for a contract call
   */
  async estimateGas(call: SecureContractCall): Promise<ApiResponse<bigint>> {
    try {
      if (!this.walletClient) {
        return createSafeError(new Error('Wallet not connected'));
      }

      const validation = ContractValidator.validateFunctionCall(call);
      if (!validation.isValid) {
        return createSafeError(new Error(`Validation failed: ${validation.errors.join(', ')}`));
      }

      const gasEstimate = await this.publicClient.estimateContractGas({
        address: call.address,
        abi: call.abi,
        functionName: call.functionName,
        args: call.args,
        account: this.walletClient.account?.address,
      });

      return { success: true, data: gasEstimate };
    } catch (error) {
      return handleContractError(error, 'gas_estimation');
    }
  }

  /**
   * Wait for transaction receipt
   */
  async waitForTransactionReceipt(hash: `0x${string}`, confirmations = 1): Promise<ApiResponse<any>> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash,
        confirmations,
        timeout: 60000, // 1 minute timeout
      });

      return { success: true, data: receipt };
    } catch (error) {
      return handleContractError(error, 'transaction_receipt');
    }
  }

  /**
   * Get current network info
   */
  getNetworkInfo() {
    return {
      networkId: this.currentNetwork,
      network: SUPPORTED_NETWORKS[this.currentNetwork],
      isWalletConnected: !!this.walletClient,
    };
  }
}

/**
 * React hook for secure contract interactions
 */
export function useSecureContract() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const networkId: NetworkId = chain?.id || 8453;
  const secureClient = new SecureContractClient(networkId);

  // Initialize wallet client when account changes
  if (address && walletClient) {
    secureClient.initializeWalletClient(address);
  }

  return {
    client: secureClient,
    networkId,
    isConnected: !!address,
    address,
  };
}

/**
 * Rate-limited contract operations
 */
export class RateLimitedContractOps {
  private client: SecureContractClient;
  private rateLimiter = createRateLimitedFunction;

  constructor(client: SecureContractClient) {
    this.client = client;
  }

  /**
   * Rate-limited read operation
   */
  readContract = this.rateLimiter(
    (call: SecureContractRead) => this.client.readContract(call),
    'CONTRACT_CALL'
  );

  /**
   * Rate-limited write operation
   */
  writeContract = this.rateLimiter(
    (call: SecureContractCall) => this.client.writeContract(call),
    'CONTRACT_CALL'
  );

  /**
   * Rate-limited gas estimation
   */
  estimateGas = this.rateLimiter(
    (call: SecureContractCall) => this.client.estimateGas(call),
    'CONTRACT_CALL'
  );
}

/**
 * Contract safety utilities
 */
export const ContractUtils = {
  /**
   * Get safe contract address for network
   */
  getContractAddress(contractName: keyof typeof CONTRACT_ADDRESSES.celo, networkId: NetworkId): Address {
    const network = SUPPORTED_NETWORKS[networkId];
    const address = network.contracts[contractName];
    
    if (!address || !ContractValidator.validateAddress(address)) {
      throw new Error(`Invalid contract address for ${contractName} on network ${networkId}`);
    }
    
    return address as Address;
  },

  /**
   * Validate transaction parameters for safety
   */
  validateTransaction(value: string | bigint | undefined, gasLimit: bigint | undefined) {
    const errors: string[] = [];

    // Value validation
    if (value !== undefined) {
      const valueBigInt = typeof value === 'string' ? parseEther(value) : value;
      if (valueBigInt < 0n) {
        errors.push('Invalid transaction value');
      }
    }

    // Gas limit validation
    if (gasLimit !== undefined && (gasLimit < 21000n || gasLimit > 10000000n)) {
      errors.push('Invalid gas limit (must be between 21,000 and 10,000,000)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      safeValue: value ? (typeof value === 'string' ? parseEther(value) : value) : undefined,
      safeGasLimit: gasLimit || 200000n // Default gas limit
    };
  },

  /**
   * Create safe contract call with defaults
   */
  createSafeCall(params: Partial<SecureContractCall> & {
    functionName: string;
    args: unknown[];
  }): SecureContractCall {
    const { validateTransaction } = ContractUtils;
    const txValidation = validateTransaction(params.value, params.gasLimit);

    if (!txValidation.isValid) {
      throw new Error(`Invalid transaction parameters: ${txValidation.errors.join(', ')}`);
    }

    return {
      address: params.address!,
      abi: params.abi!,
      functionName: params.functionName,
      args: params.args,
      value: txValidation.safeValue,
      gasLimit: txValidation.safeGasLimit,
      chainId: params.chainId,
    };
  }
};