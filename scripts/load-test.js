/**
 * Load Testing Script
 * Tests application performance under load
 * 
 * Usage: node scripts/load-test.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Load test configuration
const LOAD_TEST_CONFIG = {
  endpoints: [
    { path: '/api/events', method: 'GET', weight: 40 },
    { path: '/api/events?city=Mumbai', method: 'GET', weight: 20 },
    { path: '/api/notifications', method: 'GET', weight: 15 },
    { path: '/api/favorites', method: 'GET', weight: 10 },
    { path: '/api/chat/conversations', method: 'GET', weight: 10 },
    { path: '/api/recommendations', method: 'GET', weight: 5 }
  ],
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '50'),
  requestsPerUser: parseInt(process.env.REQUESTS_PER_USER || '10'),
  rampUpTime: parseInt(process.env.RAMP_UP_TIME || '5000'), // milliseconds
  testDuration: parseInt(process.env.TEST_DURATION || '60000'), // milliseconds
  token: process.env.TEST_TOKEN || '' // User token for authenticated endpoints
};

/**
 * Make a request to an endpoint
 */
async function makeRequest(endpoint, token) {
  const startTime = Date.now();
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      headers
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    let data;
    try {
      data = await response.json();
    } catch {
      data = { text: await response.text() };
    }

    return {
      success: response.ok,
      status: response.status,
      duration,
      endpoint: endpoint.path,
      error: data.error || null
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      status: 0,
      duration: endTime - startTime,
      endpoint: endpoint.path,
      error: error.message
    };
  }
}

/**
 * Select endpoint based on weight
 */
function selectEndpoint() {
  const totalWeight = LOAD_TEST_CONFIG.endpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of LOAD_TEST_CONFIG.endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return LOAD_TEST_CONFIG.endpoints[0];
}

/**
 * Simulate a user session
 */
async function simulateUser(userId, token) {
  const results = [];
  
  for (let i = 0; i < LOAD_TEST_CONFIG.requestsPerUser; i++) {
    const endpoint = selectEndpoint();
    const result = await makeRequest(endpoint, token);
    results.push(result);
    
    // Random delay between requests (0-500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
  }
  
  return results;
}

/**
 * Run load test
 */
async function runLoadTest() {
  console.log('🚀 Starting Load Test...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent Users: ${LOAD_TEST_CONFIG.concurrentUsers}`);
  console.log(`Requests per User: ${LOAD_TEST_CONFIG.requestsPerUser}`);
  console.log(`Total Requests: ${LOAD_TEST_CONFIG.concurrentUsers * LOAD_TEST_CONFIG.requestsPerUser}`);
  console.log(`Test Duration: ${LOAD_TEST_CONFIG.testDuration}ms\n`);

  const allResults = [];
  const startTime = Date.now();
  const endTime = startTime + LOAD_TEST_CONFIG.testDuration;

  // Create user sessions with ramp-up
  const userPromises = [];
  const rampUpDelay = LOAD_TEST_CONFIG.rampUpTime / LOAD_TEST_CONFIG.concurrentUsers;

  for (let i = 0; i < LOAD_TEST_CONFIG.concurrentUsers; i++) {
    const userPromise = new Promise(resolve => {
      setTimeout(async () => {
        const results = await simulateUser(i, LOAD_TEST_CONFIG.token);
        allResults.push(...results);
        resolve(results);
      }, i * rampUpDelay);
    });
    
    userPromises.push(userPromise);
  }

  // Wait for all users or timeout
  await Promise.race([
    Promise.all(userPromises),
    new Promise(resolve => setTimeout(resolve, LOAD_TEST_CONFIG.testDuration))
  ]);

  const totalDuration = Date.now() - startTime;

  // Analyze results
  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);
  const durations = allResults.map(r => r.duration);
  
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const p50 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.5)];
  const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
  const p99 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.99)];

  // Group by endpoint
  const byEndpoint = {};
  allResults.forEach(r => {
    if (!byEndpoint[r.endpoint]) {
      byEndpoint[r.endpoint] = { total: 0, success: 0, failed: 0, durations: [] };
    }
    byEndpoint[r.endpoint].total++;
    if (r.success) {
      byEndpoint[r.endpoint].success++;
    } else {
      byEndpoint[r.endpoint].failed++;
    }
    byEndpoint[r.endpoint].durations.push(r.duration);
  });

  // Print results
  console.log('📊 Load Test Results:\n');
  console.log(`Total Requests: ${allResults.length}`);
  console.log(`Successful: ${successful.length} (${(successful.length / allResults.length * 100).toFixed(2)}%)`);
  console.log(`Failed: ${failed.length} (${(failed.length / allResults.length * 100).toFixed(2)}%)`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`Requests per Second: ${(allResults.length / (totalDuration / 1000)).toFixed(2)}\n`);

  console.log('⏱️  Response Times:');
  console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Min: ${minDuration}ms`);
  console.log(`  Max: ${maxDuration}ms`);
  console.log(`  P50: ${p50}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  P99: ${p99}ms\n`);

  console.log('📈 By Endpoint:');
  Object.entries(byEndpoint).forEach(([endpoint, stats]) => {
    const avgDur = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
    console.log(`  ${endpoint}:`);
    console.log(`    Total: ${stats.total}, Success: ${stats.success}, Failed: ${stats.failed}`);
    console.log(`    Avg Duration: ${avgDur.toFixed(2)}ms`);
  });
  console.log('');

  // Error analysis
  if (failed.length > 0) {
    console.log('❌ Error Analysis:');
    const errorsByStatus = {};
    failed.forEach(f => {
      const key = f.status || 'NETWORK_ERROR';
      errorsByStatus[key] = (errorsByStatus[key] || 0) + 1;
    });
    
    Object.entries(errorsByStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log('');
  }

  // Performance thresholds
  const performanceThresholds = {
    avgMax: 500,
    p95Max: 1000,
    p99Max: 2000,
    errorRateMax: 1 // 1%
  };

  const errorRate = (failed.length / allResults.length) * 100;
  
  console.log('✅ Performance Checks:');
  console.log(`  Average Response Time: ${avgDuration <= performanceThresholds.avgMax ? '✅ PASS' : '❌ FAIL'} (${avgDuration.toFixed(2)}ms <= ${performanceThresholds.avgMax}ms)`);
  console.log(`  P95 Response Time: ${p95 <= performanceThresholds.p95Max ? '✅ PASS' : '❌ FAIL'} (${p95}ms <= ${performanceThresholds.p95Max}ms)`);
  console.log(`  P99 Response Time: ${p99 <= performanceThresholds.p99Max ? '✅ PASS' : '❌ FAIL'} (${p99}ms <= ${performanceThresholds.p99Max}ms)`);
  console.log(`  Error Rate: ${errorRate <= performanceThresholds.errorRateMax ? '✅ PASS' : '❌ FAIL'} (${errorRate.toFixed(2)}% <= ${performanceThresholds.errorRateMax}%)\n`);

  const allPassed = avgDuration <= performanceThresholds.avgMax &&
                    p95 <= performanceThresholds.p95Max &&
                    p99 <= performanceThresholds.p99Max &&
                    errorRate <= performanceThresholds.errorRateMax;

  console.log(`\n${allPassed ? '✅ LOAD TEST PASSED' : '❌ LOAD TEST FAILED'}\n`);

  return {
    passed: allPassed,
    stats: {
      total: allResults.length,
      successful: successful.length,
      failed: failed.length,
      avgDuration,
      p95,
      p99,
      errorRate
    }
  };
}

// Main execution
if (require.main === module) {
  runLoadTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    });
}

module.exports = { runLoadTest };
