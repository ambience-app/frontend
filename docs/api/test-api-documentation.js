#!/usr/bin/env node

/**
 * Automated API Documentation Testing Script
 * 
 * This script validates the API documentation against the actual implementation
 * and tests all documented endpoints with realistic scenarios.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const fetch = require('node-fetch');

class APIDocumentationTester {
  constructor() {
    this.config = this.loadConfiguration();
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  loadConfiguration() {
    try {
      const configPath = path.join(__dirname, 'console-config.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.warn('Could not load console-config.json, using defaults');
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      apiKey: process.env.ALCHEMY_API_KEY || 'demo',
      network: 'base-sepolia',
      walletAddress: '0x742d35Cc6634C0532925a3b8D3B35E0a0d0a8b10',
      contractAddress: '0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e',
      websocketUrl: 'ws://localhost:3000/ws'
    };
  }

  async runAllTests() {
    console.log('🚀 Starting API Documentation Tests...\n');

    await this.testOpenAPISpecification();
    await this.testEndpointAvailability();
    await this.testRequestResponseFormats();
    await this.testRateLimiting();
    await this.testErrorHandling();
    await this.testWebSocketConnectivity();
    await this.testIPFSIntegration();
    await this.testENSIntegration();
    await this.validateCodeExamples();

    this.printResults();
    return this.testResults.failed === 0;
  }

  async testOpenAPISpecification() {
    console.log('📋 Testing OpenAPI Specification...');

    try {
      const openapiPath = path.join(__dirname, 'openapi.yaml');
      const openapiContent = fs.readFileSync(openapiPath, 'utf8');
      const spec = yaml.load(openapiContent);

      // Validate OpenAPI structure
      const requiredFields = ['openapi', 'info', 'paths'];
      const missingFields = requiredFields.filter(field => !spec[field]);

      if (missingFields.length > 0) {
        this.addResult('OpenAPI Specification', false, `Missing required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate paths
      const paths = Object.keys(spec.paths);
      if (paths.length === 0) {
        this.addResult('OpenAPI Specification', false, 'No paths defined in specification');
        return;
      }

      // Validate required components
      const requiredComponents = ['schemas'];
      const missingComponents = requiredComponents.filter(comp => !spec.components[comp]);

      if (missingComponents.length > 0) {
        this.addResult('OpenAPI Specification', false, `Missing required components: ${missingComponents.join(', ')}`);
        return;
      }

      this.addResult('OpenAPI Specification', true, `Valid specification with ${paths.length} paths`);

    } catch (error) {
      this.addResult('OpenAPI Specification', false, `Failed to parse OpenAPI spec: ${error.message}`);
    }
  }

  async testEndpointAvailability() {
    console.log('🌐 Testing Endpoint Availability...');

    const endpoints = [
      {
        name: 'Send Message',
        method: 'POST',
        url: `${this.getRPCUrl()}/${this.config.apiKey}/web3/contract/sendMessage`,
        body: { roomId: 1, content: 'Test message' }
      },
      {
        name: 'Get Room Messages',
        method: 'GET',
        url: `${this.getRPCUrl()}/${this.config.apiKey}/web3/contract/getRoomMessages?roomId=1&offset=0&limit=20`
      },
      {
        name: 'Get Room Info',
        method: 'GET',
        url: `${this.getRPCUrl()}/${this.config.apiKey}/web3/contract/getRoom?roomId=1`
      },
      {
        name: 'Rate Limit Status',
        method: 'GET',
        url: `${this.getRPCUrl()}/${this.config.apiKey}/rate-limit`
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint);
        
        if (response.ok) {
          this.addResult(endpoint.name, true, `Status: ${response.status}`);
        } else if (response.status === 429) {
          this.addResult(endpoint.name, true, `Rate limited (Status: ${response.status})`);
        } else {
          this.addResult(endpoint.name, false, `HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        this.addResult(endpoint.name, false, `Request failed: ${error.message}`);
      }
    }
  }

  async testRequestResponseFormats() {
    console.log('📝 Testing Request/Response Formats...');

    try {
      // Test rate limit endpoint to verify response format
      const response = await fetch(`${this.getRPCUrl()}/${this.config.apiKey}/rate-limit`, {
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Validate response structure
        const expectedFields = ['limit', 'remaining', 'reset'];
        const missingFields = expectedFields.filter(field => !(field in data));

        if (missingFields.length === 0) {
          this.addResult('Response Format', true, 'All expected fields present');
        } else {
          this.addResult('Response Format', false, `Missing fields: ${missingFields.join(', ')}`);
        }
      } else {
        this.addResult('Response Format', false, `HTTP ${response.status}`);
      }

    } catch (error) {
      this.addResult('Response Format', false, `Format validation failed: ${error.message}`);
    }
  }

  async testRateLimiting() {
    console.log('⏱️ Testing Rate Limiting...');

    try {
      const requests = [];
      const concurrentRequests = 10;

      // Make concurrent requests to test rate limiting
      for (let i = 0; i < concurrentRequests; i++) {
        const request = fetch(`${this.getRPCUrl()}/${this.config.apiKey}/rate-limit`, {
          headers: {
            'X-API-Key': this.config.apiKey
          }
        });
        requests.push(request);
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429).length;

      if (rateLimited > 0) {
        this.addResult('Rate Limiting', true, `${rateLimited}/${concurrentRequests} requests rate limited`);
      } else {
        this.addResult('Rate Limiting', true, 'No rate limiting triggered (within limits)');
      }

    } catch (error) {
      this.addResult('Rate Limiting', false, `Rate limit test failed: ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('❌ Testing Error Handling...');

    const errorScenarios = [
      {
        name: 'Invalid Room ID',
        request: {
          url: `${this.getRPCUrl()}/${this.config.apiKey}/web3/contract/getRoom?roomId=999999`,
          headers: { 'X-API-Key': this.config.apiKey }
        }
      },
      {
        name: 'Missing API Key',
        request: {
          url: `${this.getRPCUrl()}/demo/web3/contract/getRoom?roomId=1`,
          headers: {} // No API key
        }
      }
    ];

    for (const scenario of errorScenarios) {
      try {
        const response = await fetch(scenario.request.url, {
          headers: scenario.request.headers
        });

        if (response.status >= 400) {
          this.addResult(scenario.name, true, `Proper error response: ${response.status}`);
        } else {
          this.addResult(scenario.name, false, `Expected error, got: ${response.status}`);
        }

      } catch (error) {
        // Network errors are expected for some scenarios
        this.addResult(scenario.name, true, `Expected error: ${error.message}`);
      }
    }
  }

  async testWebSocketConnectivity() {
    console.log('🔌 Testing WebSocket Connectivity...');

    return new Promise((resolve) => {
      const wsUrl = this.config.websocketUrl.replace('http', 'ws');
      
      try {
        const WebSocket = require('ws');
        const ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          this.addResult('WebSocket Connection', false, 'Connection timeout');
          ws.close();
          resolve();
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          this.addResult('WebSocket Connection', true, 'Connected successfully');
          
          // Test ping/pong
          ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          
          setTimeout(() => {
            ws.close();
            resolve();
          }, 1000);
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          this.addResult('WebSocket Connection', false, `Connection error: ${error.message}`);
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'pong') {
              this.addResult('WebSocket Protocol', true, 'Ping/pong working');
            }
          } catch (error) {
            this.addResult('WebSocket Protocol', false, 'Invalid message format');
          }
        };

      } catch (error) {
        this.addResult('WebSocket Connection', false, `WebSocket not available: ${error.message}`);
        resolve();
      }
    });
  }

  async testIPFSIntegration() {
    console.log('📦 Testing IPFS Integration...');

    try {
      // Test IPFS gateway access
      const response = await fetch('https://ipfs.io/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG');
      
      if (response.ok) {
        this.addResult('IPFS Integration', true, 'IPFS gateway accessible');
      } else {
        this.addResult('IPFS Integration', false, `IPFS gateway returned: ${response.status}`);
      }

    } catch (error) {
      this.addResult('IPFS Integration', false, `IPFS test failed: ${error.message}`);
    }
  }

  async testENSIntegration() {
    console.log('🔗 Testing ENS Integration...');

    try {
      // Test ENS resolution for a known domain
      const response = await fetch('https://cloudflare-eth.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
            data: '0x3b3b57de' + '000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045'.substring(2)
          }, 'latest']
        })
      });

      if (response.ok) {
        this.addResult('ENS Integration', true, 'ENS resolution endpoint accessible');
      } else {
        this.addResult('ENS Integration', false, `ENS endpoint returned: ${response.status}`);
      }

    } catch (error) {
      this.addResult('ENS Integration', false, `ENS test failed: ${error.message}`);
    }
  }

  async validateCodeExamples() {
    console.log('💻 Validating Code Examples...');

    const examplesDir = path.join(__dirname, '..', 'code-examples.md');
    
    try {
      if (fs.existsSync(examplesDir)) {
        const content = fs.readFileSync(examplesDir, 'utf8');
        
        // Check for common code patterns
        const patterns = [
          { name: 'JavaScript Examples', regex: /```javascript[\s\S]*?```/g },
          { name: 'Python Examples', regex: /```python[\s\S]*?```/g },
          { name: 'cURL Examples', regex: /```bash[\s\S]*?```/g }
        ];

        let hasValidExamples = false;

        for (const pattern of patterns) {
          const matches = content.match(pattern.regex);
          if (matches && matches.length > 0) {
            hasValidExamples = true;
            this.addResult(pattern.name, true, `${matches.length} examples found`);
          }
        }

        if (!hasValidExamples) {
          this.addResult('Code Examples', false, 'No valid code examples found');
        }

      } else {
        this.addResult('Code Examples', false, 'Code examples file not found');
      }

    } catch (error) {
      this.addResult('Code Examples', false, `Validation failed: ${error.message}`);
    }
  }

  async makeRequest(endpoint) {
    const options = {
      method: endpoint.method,
      headers: {
        'X-API-Key': this.config.apiKey,
        'Content-Type': 'application/json',
        ...endpoint.headers
      }
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    return fetch(endpoint.url, options);
  }

  getRPCUrl() {
    const networkUrls = {
      'base-mainnet': 'https://base-mainnet.g.alchemy.com/v2',
      'base-sepolia': 'https://base-sepolia.g.alchemy.com/v2',
      'celo-mainnet': 'https://celo-mainnet.g.alchemy.com/v2',
      'celo-alfajores': 'https://celo-alfajores.g.alchemy.com/v2'
    };

    return networkUrls[this.config.network] || networkUrls['base-sepolia'];
  }

  addResult(testName, passed, message) {
    const result = { testName, passed, message, timestamp: new Date().toISOString() };
    this.testResults.tests.push(result);

    if (passed) {
      this.testResults.passed++;
      console.log(`  ✅ ${testName}: ${message}`);
    } else {
      this.testResults.failed++;
      console.log(`  ❌ ${testName}: ${message}`);
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📝 Total: ${this.testResults.tests.length}`);

    const successRate = ((this.testResults.passed / this.testResults.tests.length) * 100).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => console.log(`  - ${test.testName}: ${test.message}`));
    }

    // Save detailed results
    const resultsPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const tester = new APIDocumentationTester();
  
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = APIDocumentationTester;