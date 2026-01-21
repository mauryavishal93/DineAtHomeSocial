/**
 * Performance Monitoring Script
 * Monitors application performance metrics
 * 
 * Usage: node scripts/performance-monitor.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Monitoring configuration
const MONITOR_CONFIG = {
  endpoints: [
    '/api/events',
    '/api/events?city=Mumbai',
    '/api/notifications',
    '/api/favorites',
    '/api/chat/conversations',
    '/api/recommendations',
    '/api/me'
  ],
  interval: parseInt(process.env.MONITOR_INTERVAL || '5000'), // 5 seconds
  duration: parseInt(process.env.MONITOR_DURATION || '300000'), // 5 minutes
  token: process.env.TEST_TOKEN || ''
};

/**
 * Monitor endpoint performance
 */
async function monitorEndpoint(endpoint, token) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers
    });

    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    await response.json(); // Consume response

    return {
      endpoint,
      success: response.ok,
      status: response.status,
      duration,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      endpoint,
      success: false,
      status: 0,
      duration: endTime - startTime,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Calculate statistics
 */
function calculateStats(results) {
  const durations = results.map(r => r.duration).filter(d => d > 0);
  
  if (durations.length === 0) return null;

  durations.sort((a, b) => a - b);
  
  return {
    count: durations.length,
    avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: durations[0],
    max: durations[durations.length - 1],
    p50: durations[Math.floor(durations.length * 0.5)],
    p95: durations[Math.floor(durations.length * 0.95)],
    p99: durations[Math.floor(durations.length * 0.99)]
  };
}

/**
 * Run performance monitoring
 */
async function runPerformanceMonitoring() {
  console.log('📊 Starting Performance Monitoring...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Monitoring Interval: ${MONITOR_CONFIG.interval}ms`);
  console.log(`Duration: ${MONITOR_CONFIG.duration}ms\n`);

  const results = {};
  MONITOR_CONFIG.endpoints.forEach(endpoint => {
    results[endpoint] = [];
  });

  const startTime = Date.now();
  const endTime = startTime + MONITOR_CONFIG.duration;

  console.log('🔄 Monitoring started...\n');

  // Monitoring loop
  const monitorInterval = setInterval(async () => {
    if (Date.now() >= endTime) {
      clearInterval(monitorInterval);
      return;
    }

    // Monitor all endpoints concurrently
    const promises = MONITOR_CONFIG.endpoints.map(endpoint =>
      monitorEndpoint(endpoint, MONITOR_CONFIG.token)
    );

    const endpointResults = await Promise.all(promises);

    endpointResults.forEach(result => {
      results[result.endpoint].push(result);
      
      // Log in real-time
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.endpoint}: ${result.duration}ms (Status: ${result.status})`);
    });
  }, MONITOR_CONFIG.interval);

  // Wait for monitoring to complete
  await new Promise(resolve => setTimeout(resolve, MONITOR_CONFIG.duration));
  clearInterval(monitorInterval);

  console.log('\n📈 Performance Statistics:\n');

  // Calculate and display statistics for each endpoint
  Object.entries(results).forEach(([endpoint, endpointResults]) => {
    const stats = calculateStats(endpointResults);
    const successful = endpointResults.filter(r => r.success).length;
    const failed = endpointResults.filter(r => !r.success).length;

    if (!stats) {
      console.log(`${endpoint}: No data`);
      return;
    }

    console.log(`${endpoint}:`);
    console.log(`  Requests: ${stats.count} (Success: ${successful}, Failed: ${failed})`);
    console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
    console.log(`  Min: ${stats.min}ms`);
    console.log(`  Max: ${stats.max}ms`);
    console.log(`  P50: ${stats.p50}ms`);
    console.log(`  P95: ${stats.p95}ms`);
    console.log(`  P99: ${stats.p99}ms`);
    console.log('');
  });

  // Overall statistics
  const allResults = Object.values(results).flat();
  const overallStats = calculateStats(allResults);
  const overallSuccessful = allResults.filter(r => r.success).length;
  const overallFailed = allResults.filter(r => !r.success).length;

  if (overallStats) {
    console.log('📊 Overall Statistics:');
    console.log(`  Total Requests: ${overallStats.count}`);
    console.log(`  Successful: ${overallSuccessful} (${(overallSuccessful / overallStats.count * 100).toFixed(2)}%)`);
    console.log(`  Failed: ${overallFailed} (${(overallFailed / overallStats.count * 100).toFixed(2)}%)`);
    console.log(`  Average Response Time: ${overallStats.avg.toFixed(2)}ms`);
    console.log(`  P95 Response Time: ${overallStats.p95}ms`);
    console.log(`  P99 Response Time: ${overallStats.p99}ms\n`);
  }

  // Alert on performance issues
  const alerts = [];
  
  Object.entries(results).forEach(([endpoint, endpointResults]) => {
    const stats = calculateStats(endpointResults);
    if (!stats) return;

    const errorRate = (endpointResults.filter(r => !r.success).length / stats.count) * 100;
    
    if (stats.avg > 500) {
      alerts.push(`⚠️  ${endpoint}: High average response time (${stats.avg.toFixed(2)}ms)`);
    }
    if (stats.p95 > 1000) {
      alerts.push(`⚠️  ${endpoint}: High P95 response time (${stats.p95}ms)`);
    }
    if (errorRate > 1) {
      alerts.push(`⚠️  ${endpoint}: High error rate (${errorRate.toFixed(2)}%)`);
    }
  });

  if (alerts.length > 0) {
    console.log('⚠️  Performance Alerts:');
    alerts.forEach(alert => console.log(`  ${alert}`));
    console.log('');
  } else {
    console.log('✅ No performance issues detected\n');
  }

  return {
    results,
    overallStats,
    alerts
  };
}

// Main execution
if (require.main === module) {
  runPerformanceMonitoring()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Monitoring failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceMonitoring };
