# Test Scripts Documentation

This directory contains test scripts for validating edge case fixes and performance testing.

## Scripts

### 1. Concurrent Booking Test (`test-concurrent-booking.js`)

Tests race condition fixes by simulating multiple users booking the same seats simultaneously.

**Usage:**
```bash
TEST_EVENT_ID=<eventId> \
TEST_USER_TOKENS=<token1,token2,token3,...> \
TEST_URL=<baseUrl> \
node scripts/test-concurrent-booking.js
```

**Example:**
```bash
TEST_EVENT_ID=507f1f77bcf86cd799439011 \
TEST_USER_TOKENS=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...,eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
TEST_URL=http://localhost:3000 \
node scripts/test-concurrent-booking.js
```

**What it tests:**
- Race condition prevention
- Overbooking prevention
- Seat count accuracy
- Transaction integrity

**Expected Output:**
- Number of successful bookings
- Seat count validation
- Overbooking detection
- Test pass/fail status

---

### 2. Load Testing (`load-test.js`)

Tests application performance under load with configurable concurrent users and request rates.

**Usage:**
```bash
CONCURRENT_USERS=50 \
REQUESTS_PER_USER=10 \
TEST_TOKEN=<userToken> \
TEST_URL=<baseUrl> \
RAMP_UP_TIME=5000 \
TEST_DURATION=60000 \
node scripts/load-test.js
```

**Environment Variables:**
- `CONCURRENT_USERS`: Number of concurrent users (default: 50)
- `REQUESTS_PER_USER`: Requests per user (default: 10)
- `TEST_TOKEN`: User authentication token
- `TEST_URL`: Base URL (default: http://localhost:3000)
- `RAMP_UP_TIME`: Ramp-up time in ms (default: 5000)
- `TEST_DURATION`: Test duration in ms (default: 60000)

**What it tests:**
- Response times (avg, p50, p95, p99)
- Error rates
- Requests per second
- Endpoint-specific performance
- Performance thresholds

**Expected Output:**
- Total requests and success/failure counts
- Response time statistics
- Performance by endpoint
- Error analysis
- Performance pass/fail status

---

### 3. Performance Monitoring (`performance-monitor.js`)

Continuously monitors application performance metrics in real-time.

**Usage:**
```bash
MONITOR_INTERVAL=5000 \
MONITOR_DURATION=300000 \
TEST_TOKEN=<userToken> \
TEST_URL=<baseUrl> \
node scripts/performance-monitor.js
```

**Environment Variables:**
- `MONITOR_INTERVAL`: Monitoring interval in ms (default: 5000)
- `MONITOR_DURATION`: Total monitoring duration in ms (default: 300000)
- `TEST_TOKEN`: User authentication token
- `TEST_URL`: Base URL (default: http://localhost:3000)

**What it monitors:**
- Real-time response times
- Success/failure rates
- Memory usage
- Performance alerts
- Endpoint-specific metrics

**Expected Output:**
- Real-time performance logs
- Statistics by endpoint
- Overall performance metrics
- Performance alerts
- Summary report

---

## Prerequisites

1. **Node.js** (v18+)
2. **MongoDB** running and accessible
3. **Application** running (for testing)
4. **Test Data**:
   - Event IDs for testing
   - User tokens for authenticated endpoints
   - Test users created

## Setup

1. Install dependencies (if not already installed):
```bash
npm install
```

2. Set up test environment variables:
```bash
export TEST_URL=http://localhost:3000
export TEST_TOKEN=<your-test-token>
export TEST_EVENT_ID=<test-event-id>
```

3. Create test users and events:
- Register test users (Guest role)
- Create test events
- Get authentication tokens

## Running Tests

### Quick Test Suite
```bash
# Run all tests sequentially
npm run test:all
```

### Individual Tests
```bash
# Concurrent booking test
npm run test:concurrent

# Load test
npm run test:load

# Performance monitoring
npm run test:monitor
```

## Test Results

All tests output:
- ✅ Pass indicators
- ❌ Fail indicators
- 📊 Statistics
- ⚠️ Warnings/Alerts

## Performance Benchmarks

### Response Time Targets
- Average: < 500ms
- P50: < 500ms
- P95: < 1000ms
- P99: < 2000ms

### Error Rate Target
- < 1%

### Throughput Target
- > 100 requests/second

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure application is running
   - Check TEST_URL is correct

2. **Authentication Errors**
   - Verify TEST_TOKEN is valid
   - Check token expiration

3. **Event Not Found**
   - Verify TEST_EVENT_ID exists
   - Check event status (should be OPEN)

4. **MongoDB Connection Issues**
   - Verify MongoDB is running
   - Check connection string

## Continuous Integration

These scripts can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Load Tests
  run: |
    npm run test:load
  env:
    TEST_URL: ${{ secrets.TEST_URL }}
    TEST_TOKEN: ${{ secrets.TEST_TOKEN }}
```

## Regular Testing Schedule

Recommended testing schedule:
- **Daily**: Performance monitoring (5 minutes)
- **Weekly**: Load testing (full suite)
- **Before Deploy**: All tests
- **After Deploy**: Smoke tests

---

**Last Updated:** $(date)
