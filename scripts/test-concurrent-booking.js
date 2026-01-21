/**
 * Concurrent Booking Test Script
 * Tests race condition fixes for booking flow
 * 
 * Usage: node scripts/test-concurrent-booking.js
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  eventId: process.env.TEST_EVENT_ID || '',
  userTokens: [], // Will be populated
  concurrentRequests: 10,
  seatsPerRequest: 2,
  totalSeatsAvailable: 10
};

/**
 * Create a booking request
 */
async function createBooking(token, eventId, seats) {
  const response = await fetch(`${BASE_URL}/api/guest/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      eventSlotId: eventId,
      seats: seats,
      guestName: `Test Guest ${Math.random().toString(36).substr(2, 9)}`,
      guestMobile: `+91${Math.floor(Math.random() * 10000000000)}`,
      guestAge: 25,
      guestGender: 'Male',
      additionalGuests: seats > 1 ? [{
        name: `Additional Guest ${Math.random().toString(36).substr(2, 9)}`,
        mobile: `+91${Math.floor(Math.random() * 10000000000)}`,
        age: 26,
        gender: 'Female'
      }] : []
    })
  });

  const data = await response.json();
  return {
    status: response.status,
    ok: response.ok,
    data: data.data || data,
    error: data.error
  };
}

/**
 * Get event details
 */
async function getEvent(eventId) {
  const response = await fetch(`${BASE_URL}/api/events/${eventId}`);
  const data = await response.json();
  return data.data || data;
}

/**
 * Run concurrent booking test
 */
async function runConcurrentBookingTest() {
  console.log('🚀 Starting Concurrent Booking Test...\n');
  console.log(`Event ID: ${TEST_CONFIG.eventId}`);
  console.log(`Concurrent Requests: ${TEST_CONFIG.concurrentRequests}`);
  console.log(`Seats per Request: ${TEST_CONFIG.seatsPerRequest}`);
  console.log(`Total Seats Available: ${TEST_CONFIG.totalSeatsAvailable}\n`);

  // Get initial event state
  const initialEvent = await getEvent(TEST_CONFIG.eventId);
  const initialSeats = initialEvent.seatsLeft || initialEvent.seatsRemaining;
  console.log(`Initial Seats Remaining: ${initialSeats}\n`);

  // Create concurrent booking requests
  const promises = TEST_CONFIG.userTokens.map((token, index) => 
    createBooking(token, TEST_CONFIG.eventId, TEST_CONFIG.seatsPerRequest)
      .then(result => ({
        index,
        success: result.ok,
        bookingId: result.data?.bookingId,
        error: result.error,
        status: result.status
      }))
      .catch(error => ({
        index,
        success: false,
        error: error.message,
        status: 500
      }))
  );

  console.log('📤 Sending concurrent booking requests...\n');
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const endTime = Date.now();

  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const expectedMaxBookings = Math.floor(initialSeats / TEST_CONFIG.seatsPerRequest);

  console.log('📊 Test Results:');
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Expected Max Bookings: ${expectedMaxBookings}`);
  console.log(`Time Taken: ${endTime - startTime}ms\n`);

  // Get final event state
  const finalEvent = await getEvent(TEST_CONFIG.eventId);
  const finalSeats = finalEvent.seatsLeft || finalEvent.seatsRemaining;
  const seatsBooked = initialSeats - finalSeats;
  const expectedSeatsBooked = successful.length * TEST_CONFIG.seatsPerRequest;

  console.log('📈 Event State:');
  console.log(`Initial Seats: ${initialSeats}`);
  console.log(`Final Seats: ${finalSeats}`);
  console.log(`Seats Booked: ${seatsBooked}`);
  console.log(`Expected Seats Booked: ${expectedSeatsBooked}\n`);

  // Validation
  console.log('✅ Validation:');
  const overbookingDetected = seatsBooked > initialSeats;
  const correctBookings = successful.length <= expectedMaxBookings;
  const correctSeats = seatsBooked === expectedSeatsBooked && seatsBooked <= initialSeats;

  console.log(`No Overbooking: ${!overbookingDetected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Correct Booking Count: ${correctBookings ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Correct Seat Count: ${correctSeats ? '✅ PASS' : '❌ FAIL'}\n`);

  if (failed.length > 0) {
    console.log('❌ Failed Requests:');
    failed.forEach(f => {
      console.log(`  Request ${f.index}: ${f.error || 'Unknown error'} (Status: ${f.status})`);
    });
    console.log('');
  }

  if (successful.length > 0) {
    console.log('✅ Successful Bookings:');
    successful.forEach(s => {
      console.log(`  Booking ${s.index}: ${s.bookingId}`);
    });
    console.log('');
  }

  // Final verdict
  const testPassed = !overbookingDetected && correctBookings && correctSeats;
  console.log(`\n${testPassed ? '✅ TEST PASSED' : '❌ TEST FAILED'}\n`);

  return {
    passed: testPassed,
    results,
    initialSeats,
    finalSeats,
    seatsBooked,
    expectedSeatsBooked
  };
}

// Main execution
if (require.main === module) {
  if (!TEST_CONFIG.eventId) {
    console.error('❌ Error: TEST_EVENT_ID environment variable is required');
    console.error('Usage: TEST_EVENT_ID=<eventId> TEST_URL=<url> node scripts/test-concurrent-booking.js');
    process.exit(1);
  }

  if (TEST_CONFIG.userTokens.length === 0) {
    console.error('❌ Error: User tokens required');
    console.error('Set TEST_USER_TOKENS environment variable (comma-separated)');
    process.exit(1);
  }

  runConcurrentBookingTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runConcurrentBookingTest };
