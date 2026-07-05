# Solora StayCo - Testing Guide

## Table of Contents
1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Manual Testing Checklist](#manual-testing-checklist)
4. [Test Cases](#test-cases)
5. [Test Summary Report](#test-summary-report)

---

## Testing Overview

This guide provides comprehensive testing procedures for Solora StayCo. The goal is to achieve an 85% passing rate as required by IT-305 Final Requirements.

### Testing Types
- **Unit Testing**: Individual component testing
- **Integration Testing**: Feature integration testing
- **Manual Testing**: User flow testing
- **Security Testing**: Authentication and authorization
- **Performance Testing**: Load and response time

---

## Test Environment Setup

### Prerequisites
1. Node.js installed (v16+)
2. Firebase project configured
3. Test user accounts created
4. Browser developer tools enabled

### Setup Steps
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Access application:
   - URL: `http://localhost:3000`

4. Create test accounts:
   - Guest account
   - Host account
   - Admin account (requires manual role assignment)

---

## Manual Testing Checklist

### Authentication Testing

#### Sign Up
- [ ] Create new guest account
- [ ] Create new host account
- [ ] Verify email validation
- [ ] Verify password requirements (min 6 characters)
- [ ] Verify password confirmation match
- [ ] Verify role selection works
- [ ] Verify redirect to appropriate dashboard after signup
- [ ] Verify user document created in Firestore

#### Sign In
- [ ] Sign in with correct credentials
- [ ] Sign in with incorrect password (error handling)
- [ ] Sign in with non-existent email (error handling)
- [ ] Verify redirect to role-specific dashboard
- [ ] Verify "Remember me" functionality (if implemented)

#### Sign Out
- [ ] Sign out from dashboard
- [ ] Verify redirect to home page
- [ ] Verify protected routes are inaccessible after signout

#### Password Reset
- [ ] Request password reset with valid email
- [ ] Verify email sent
- [ ] Reset password via email link
- [ ] Sign in with new password

---

### Guest Features Testing

#### Explore Page
- [ ] View all listings
- [ ] Search by location
- [ ] Search by title/description
- [ ] Filter by category (Home, Experience, Service)
- [ ] Filter by city
- [ ] Filter by price range
- [ ] Filter by number of guests
- [ ] View featured listings
- [ ] Clear filters
- [ ] Pagination (if implemented)

#### Listing Detail Page
- [ ] View listing details
- [ ] View photo gallery
- [ ] View amenities
- [ ] View reviews
- [ ] View location
- [ ] Add to wishlist (signed in)
- [ ] Remove from wishlist
- [ ] Select dates
- [ ] Select number of guests
- [ ] View price calculation
- [ ] Click "Reserve" button

#### Booking Flow
- [ ] Complete booking form
- [ ] Select payment method (E-wallet)
- [ ] Verify wallet balance display
- [ ] Complete booking with sufficient balance
- [ ] Attempt booking with insufficient balance (error)
- [ ] View booking confirmation
- [ ] Verify booking created in Firestore
- [ ] Verify payment record created

#### Wishlist
- [ ] Add listing to wishlist
- [ ] View wishlist page
- [ ] Remove from wishlist
- [ ] Verify wishlist persists after page refresh

#### E-Wallet
- [ ] View wallet balance
- [ ] Add funds ($50, $100, $200 quick buttons)
- [ ] Add custom amount
- [ ] View transaction history
- [ ] Verify balance updates after adding funds
- [ ] Verify transaction record created

#### Account Settings
- [ ] Update display name
- [ ] Update phone number
- [ ] Upload profile photo
- [ ] Verify changes saved
- [ ] View account information

#### Mood-Based Discovery
- [ ] Select each mood card and verify listings update
- [ ] Clear mood filter and verify all listings return
- [ ] Complete a booking after selecting a mood and verify it succeeds
- [ ] Confirm recommendations appear on guest dashboard after mood-based booking

#### Notifications
- [ ] Submit a booking and verify guest notification appears
- [ ] Sign in as host and verify host notification for new booking
- [ ] Use "Mark all as read" and ensure notifications clear

---

### Host Features Testing

#### Create Listing
- [ ] Fill in all required fields
- [ ] Add location information
- [ ] Set pricing
- [ ] Add amenities
- [ ] Upload multiple photos
- [ ] Set featured photo
- [ ] Assign mood tags and ambience metadata
- [ ] Save as draft
- [ ] Publish listing
- [ ] Verify listing appears in "My Listings"
- [ ] Verify listing visible in Explore page (if published)

#### Manage Listings
- [ ] View all listings
- [ ] Filter by status (All, Active, Draft, Inactive)
- [ ] Edit listing
- [ ] Delete listing
- [ ] Verify changes saved

#### Manage Bookings
- [ ] View all bookings
- [ ] Filter by status
- [ ] View today's check-ins
- [ ] View upcoming bookings
- [ ] Confirm pending booking
- [ ] Cancel booking
- [ ] Verify booking status updates

#### Messages
- [ ] View conversations list
- [ ] Open conversation
- [ ] Send message
- [ ] Receive message (test with two accounts)
- [ ] Verify unread count
- [ ] Verify messages marked as read

---

### Admin Features Testing

#### Dashboard
- [ ] View all statistics
- [ ] Verify data accuracy
- [ ] View best reviews
- [ ] View lowest reviews
- [ ] Access quick action links

#### User Management
- [ ] View all users
- [ ] Search users
- [ ] Filter by role
- [ ] Change user role
- [ ] Verify role change takes effect

#### Payment Review
- [ ] View all payments
- [ ] Filter by status
- [ ] Confirm pending payment
- [ ] Mark payment as failed
- [ ] Process refund
- [ ] Verify payment status updates

#### Service Fee Control
- [ ] View current service fee
- [ ] Update service fee
- [ ] Verify calculation example
- [ ] Save changes
- [ ] Verify changes saved

#### Reports Generation
- [ ] Generate bookings report
- [ ] Generate payments report
- [ ] Generate users report
- [ ] Generate listings report
- [ ] Verify report data accuracy
- [ ] Test date range filtering

#### Mood Library
- [ ] Create a new mood preset
- [ ] Deactivate and reactivate a mood
- [ ] Delete a mood and ensure it disappears from Explore/Host forms

---

## Test Cases

### TC-001: Guest Sign Up
**Objective**: Verify guest can create account
**Steps**:
1. Navigate to Sign Up page
2. Select "Book accommodations (Guest)"
3. Enter valid information
4. Click "Sign Up"
**Expected**: Account created, redirected to guest dashboard
**Status**: [ ] Pass [ ] Fail

### TC-002: Host Sign Up
**Objective**: Verify host can create account
**Steps**:
1. Navigate to Sign Up page
2. Select "List my property (Host)"
3. Enter valid information
4. Click "Sign Up"
**Expected**: Account created, redirected to host dashboard
**Status**: [ ] Pass [ ] Fail

### TC-003: Search Listings
**Objective**: Verify search functionality
**Steps**:
1. Navigate to Explore page
2. Enter search term in search bar
3. Click "Search"
**Expected**: Relevant listings displayed
**Status**: [ ] Pass [ ] Fail

### TC-004: Filter Listings
**Objective**: Verify filter functionality
**Steps**:
1. Navigate to Explore page
2. Select category filter
3. Set price range
4. Apply filters
**Expected**: Listings filtered correctly
**Status**: [ ] Pass [ ] Fail

### TC-005: Create Booking
**Objective**: Verify booking creation
**Steps**:
1. View listing detail
2. Select dates and guests
3. Click "Reserve"
4. Fill booking form
5. Select payment method
6. Confirm booking
**Expected**: Booking created, confirmation shown
**Status**: [ ] Pass [ ] Fail

### TC-006: E-Wallet Payment
**Objective**: Verify e-wallet payment
**Steps**:
1. Add funds to wallet
2. Create booking
3. Select e-wallet payment
4. Complete booking
**Expected**: Payment processed, balance deducted
**Status**: [ ] Pass [ ] Fail

### TC-007: Create Listing
**Objective**: Verify host can create listing
**Steps**:
1. Sign in as host
2. Navigate to Create Listing
3. Fill all required fields
4. Upload photos
5. Publish listing
**Expected**: Listing created and visible
**Status**: [ ] Pass [ ] Fail

### TC-008: Confirm Booking (Host)
**Objective**: Verify host can confirm booking
**Steps**:
1. Sign in as host
2. View bookings
3. Find pending booking
4. Click "Confirm"
**Expected**: Booking status changes to confirmed
**Status**: [ ] Pass [ ] Fail

### TC-009: Send Message
**Objective**: Verify messaging functionality
**Steps**:
1. Sign in as host
2. Navigate to Messages
3. Select conversation
4. Type message
5. Send message
**Expected**: Message sent and displayed
**Status**: [ ] Pass [ ] Fail

### TC-010: Admin User Management
**Objective**: Verify admin can manage users
**Steps**:
1. Sign in as admin
2. Navigate to User Management
3. Search for user
4. Change user role
**Expected**: Role changed successfully
**Status**: [ ] Pass [ ] Fail

### TC-011: Mood-Based Search
**Objective**: Verify mood selector filters listings
**Steps**:
1. Navigate to Explore page
2. Select a mood card
3. Verify listings update to match the mood
4. Clear mood filter
**Expected**: Listings change according to mood and reset when cleared
**Status**: [ ] Pass [ ] Fail

### TC-012: Admin Mood Library
**Objective**: Verify admin can manage mood presets
**Steps**:
1. Sign in as admin
2. Go to Admin Dashboard → Mood Library
3. Create a new mood
4. Deactivate/activate the mood
5. Delete the mood
**Expected**: Moods are created, toggled, and deleted successfully
**Status**: [ ] Pass [ ] Fail

### TC-013: Notifications Flow
**Objective**: Verify notifications trigger for bookings
**Steps**:
1. Sign in as guest and submit a booking
2. Check guest dashboard notifications
3. Sign in as the host of that listing
4. Check host dashboard notifications
**Expected**: Both guest and host receive relevant notifications
**Status**: [ ] Pass [ ] Fail

---

## Test Summary Report

### Test Execution Summary

**Total Test Cases**: 50+
**Passed**: ___
**Failed**: ___
**Pass Rate**: ___%

### Test Results by Feature

| Feature | Test Cases | Passed | Failed | Pass Rate |
|---------|-----------|--------|--------|-----------|
| Authentication | 10 | ___ | ___ | ___% |
| Guest Features | 15 | ___ | ___ | ___% |
| Host Features | 12 | ___ | ___ | ___% |
| Admin Features | 10 | ___ | ___ | ___% |
| E-Wallet & Payments | 8 | ___ | ___ | ___% |

### Critical Issues Found

1. **Issue**: [Description]
   - **Severity**: High/Medium/Low
   - **Status**: Open/Resolved
   - **Steps to Reproduce**: [Steps]

2. **Issue**: [Description]
   - **Severity**: High/Medium/Low
   - **Status**: Open/Resolved
   - **Steps to Reproduce**: [Steps]

### Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---

## Automated Testing (Future)

### Unit Tests
- Component rendering tests
- Service function tests
- Utility function tests

### Integration Tests
- Authentication flow
- Booking flow
- Payment flow

### E2E Tests
- Complete user journeys
- Cross-browser testing

---

## Performance Testing

### Load Testing
- Test with multiple concurrent users
- Test database query performance
- Test image loading performance

### Response Time Targets
- Page load: < 2 seconds
- API calls: < 500ms
- Image load: < 1 second

---

## Security Testing

### Authentication Security
- [ ] Verify password encryption
- [ ] Test session timeout
- [ ] Test unauthorized access attempts

### Authorization Testing
- [ ] Verify role-based access control
- [ ] Test protected routes
- [ ] Verify data access restrictions

### Data Security
- [ ] Verify Firestore rules enforced
- [ ] Verify Storage rules enforced
- [ ] Test input validation

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Test Sign-Off

**Tester Name**: _________________
**Date**: _________________
**Overall Status**: [ ] Pass [ ] Fail
**Pass Rate**: ___%
**Comments**: 

---

**Last Updated**: December 2024
**Version**: 1.0

