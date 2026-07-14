# E-commerce QA Bug Log

Test environment: React frontend at `http://localhost:5173`, Node/Express API at
`http://localhost:3000`, isolated MongoDB users and products prefixed with
`codex.qa` / `CODEX QA`.

## Flow map

- Authentication: `/api/v1/auth/*`, JWT access/refresh tokens, Redux-persisted
  frontend session, `ProtectedRoute`, `TokenVerify`, and `isAdmin`.
- Catalog: public category/product APIs, Redux catalog slices, listing/search,
  filters, sorting, and client-side pagination.
- Cart: authenticated MongoDB cart plus Redux/local persistence, quantity and
  coupon updates, and checkout handoff.
- Checkout/payment: authenticated address and coupon validation, COD order
  creation, or Razorpay order creation followed by server-side signature
  verification.
- Post-order: user order history/detail, stock updates, reviews and returns.
- Admin: role-protected dashboard, catalog, inventory, orders, users, coupons,
  reviews, policies, banners, returns, audit logs, and login activity.

## Authentication and authorization

### AUTH-01 - Blocked user retains API access with an existing token

- Status: Found
- Severity: major
- Location: `src/middlewere/auth.middlewere.js` (`TokenVerify`); every route
  protected only by that middleware, for example `GET /api/v1/cart/get-all`
- Steps to reproduce:
  1. Log in as an active user and retain the access token.
  2. Block the user in the database/admin panel.
  3. Call `GET /api/v1/cart/get-all` with the retained token.
- Expected: `403` and no protected data or mutations are allowed.
- Actual: `200`; the JWT is trusted without checking whether the account is
  blocked, inactive, or deleted. Refresh is correctly rejected, but the old
  access token remains usable until expiry.

### AUTH-02 - Signup accepts malformed email and one-character password

- Status: Found
- Severity: major
- Location: `src/controller/auth.controller.js` (`CreateUser`),
  `POST /api/v1/auth/create`
- Steps to reproduce: submit `{ "Email": "not-an-email", "Password": "x" }`.
- Expected: `400` with field validation details and no database record.
- Actual: `201`; an active user and verification record are persisted for the
  malformed address and weak password.

### AUTH-03 - Malformed JSON leaks an HTML stack trace

- Status: Found
- Severity: major
- Location: `src/index.js`, Express JSON parser error handling
- Steps to reproduce: send the incomplete body `{ "Email":` with
  `Content-Type: application/json` to `POST /api/v1/auth/login`.
- Expected: a sanitized JSON `400` response.
- Actual: Express returns an HTML error document containing internal stack and
  filesystem information.

### AUTH-04 - Forgot/reset password frontend calls do not match the API

- Status: Found by route-contract inspection; UI verification pending
- Severity: blocker
- Location: frontend auth slice versus backend `src/router/auth.routes.js`
- Steps to reproduce: submit the forgot-password or reset-password form.
- Expected: calls to `/api/v1/auth/forgot-password` and
  `/api/v1/auth/reset-password` using the backend field names.
- Actual: the frontend uses `/api/test/forget-password` and
  `/api/v1/user_auth/reset_password`; reset also sends incompatible fields.

### AUTH-05 - Logout and refresh rotation do not revoke tokens

- Status: Found
- Severity: major
- Location: `POST /api/v1/auth/logout`, `RefreshToken`, and frontend logout
- Steps to reproduce: log in, submit logout, then send the same refresh token
  to `/api/v1/auth/refresh-token`.
- Expected: the logged-out token is rejected; rotating a refresh token also
  invalidates its predecessor without affecting other devices.
- Actual: logout only closes login activity and all signed tokens remain valid;
  the old refresh token returns `200` and mints another token pair.

### Auth checks that passed before fixes

- Valid login is case-insensitive; invalid/missing credentials are rejected.
- Missing, malformed, and expired access tokens are rejected with `401`.
- Valid refresh succeeds; malformed refresh and blocked-account refresh fail.
- Cart, order history, and admin dashboard reject requests without a token.

## Product listing, search, filters, and pagination

### CAT-01 - Default price filter silently hides products over Rs.20,000

- Status: Found
- Severity: major
- Location: frontend `src/pages/AllProducts.jsx` and
  `src/pages/ProductListing.jsx`
- Steps to reproduce: add a product priced above Rs.20,000, then open All
  Products or its category without changing any filter.
- Expected: every product is visible until the user intentionally sets a cap.
- Actual: `maxPrice` defaults to `20000`, so the product is omitted while the
  page still presents itself as an unfiltered catalog.

### CAT-02 - Category filter displays MongoDB IDs instead of names

- Status: Found
- Severity: major
- Location: frontend `src/pages/AllProducts.jsx`; normalized product has both
  `category` (ID) and `categoryName`, but the UI renders `category`.
- Steps to reproduce: open All Products and inspect the Category filters.
- Expected: readable category names.
- Actual: raw ObjectId values are shown.

### CAT-03 - Popularity sort does not sort

- Status: Found
- Severity: minor
- Location: frontend `src/pages/AllProducts.jsx` and
  `src/pages/ProductListing.jsx`
- Steps to reproduce: choose another sort, then choose Popularity; compare the
  order with review counts.
- Expected: highest-engagement products appear first.
- Actual: the `popularity` branch performs no sort and merely restores source
  database order.

### CAT-04 - Category pagination can remain on an invalid page

- Status: Found
- Severity: major
- Location: frontend `src/pages/ProductListing.jsx`
- Steps to reproduce: navigate to a later page, then change category, price,
  rating, or sort so the new result has fewer pages.
- Expected: pagination resets to page 1 and results remain visible.
- Actual: only brand changes explicitly reset the page; slicing can return an
  empty grid even though matching results exist.

### Catalog checks that passed before fixes

- Empty search produces a controlled zero-result state.
- Special characters and SQL-injection-like text are handled as plain local
  substrings and are not sent to a database query.
- Price, rating, category, and brand predicates otherwise match displayed data.
- Search resets pagination when the query changes; zero and single-result
  pagination states render without an extra page.

## Cart

### CART-01 - Invalid quantities are accepted or silently changed

- Status: Found
- Severity: major
- Location: `src/controller/cart.controller.js`, `POST /api/v1/cart/single-add`
  and `PATCH /api/v1/cart/quantity`
- Steps to reproduce: add with `quantity: -2` or `1.5`, then update a line to
  `2.5`.
- Expected: quantities must be positive whole numbers; invalid values return
  `400` without mutating the cart.
- Actual: `-2` is silently converted to `1`; fractional adds and updates are
  persisted. Zero/negative updates are correctly rejected.

### CART-02 - Browser cart cache is shared across user sessions

- Status: Found by state-flow inspection; browser verification pending
- Severity: major
- Location: frontend `src/store/cartSlice.js` and `src/store/authSlice.js`
- Steps to reproduce: log in as user A, fetch a cart, log out, then view the
  cart or log in as user B before the next successful cart fetch.
- Expected: authenticated cart state disappears on logout and another user
  never sees user A's cached lines.
- Actual: all authenticated and guest carts use the global
  `astromart_cart` key and logout does not reset cart Redux state.

### CART-03 - Guest cart is discarded on login

- Status: Found by state-flow inspection; browser verification pending
- Severity: major
- Location: frontend `src/store/cartSlice.js` (`fetchCart`)
- Steps to reproduce: add a product while logged out, then log in.
- Expected: valid guest lines merge into the user's server cart.
- Actual: the first authenticated fetch replaces local lines with the server
  response.

### CART-04 - Clear-cart reports local success when the API fails

- Status: Found by failure-path inspection
- Severity: major
- Location: frontend `src/store/cartSlice.js` (`clearCart`)
- Steps to reproduce: interrupt the API or force `DELETE /cart/clear` to return
  an error, then clear the cart (including after checkout).
- Expected: preserve/re-fetch state and report that server clearing failed.
- Actual: all errors are swallowed and Redux/local state is emptied, while the
  server cart remains populated and later reappears.

### Cart checks that passed before fixes

- Adding the same product/variant twice increments one existing line.
- Server prices override manipulated client price/MRP values.
- Stock limits are enforced and admin roles cannot add products.
- Remove and clear endpoints are authenticated; zero/negative quantity updates
  return `400`; coupons are cleared after cart mutations.

## Checkout

### CHECKOUT-01 - API accepts invalid phone and pincode formats

- Status: Found
- Severity: major
- Location: `src/utils/order-pricing.service.js`, COD and Razorpay preparation
- Steps to reproduce: place an otherwise valid order with `phone: "abc"` and
  `pincode: "x"`.
- Expected: `400` with a useful field error.
- Actual: `201`; the invalid delivery details are stored and stock is reduced.

### CHECKOUT-02 - Frontend accepts impossible phone/PIN values

- Status: Found by validation inspection
- Severity: major
- Location: frontend `src/utils/checkoutAddress.js`
- Steps to reproduce: enter `0000000000` and PIN `000000`.
- Expected: Indian mobile number starts with 6-9 and PIN starts with 1-9.
- Actual: any ten/six digits pass, so profile `isFilled` and checkout can treat
  impossible contact details as deliverable.

### CHECKOUT-03 - Duplicate COD submissions create duplicate orders

- Status: Found
- Severity: blocker
- Location: `POST /api/v1/order/create`, frontend checkout submission
- Steps to reproduce: issue two simultaneous identical order requests (or
  double-submit before UI state commits).
- Expected: one order and one stock decrement for a checkout attempt.
- Actual: both return `201`, create different order IDs, and each decrements
  inventory. There is no server idempotency key.

### CHECKOUT-04 - Checkout clears asynchronously without verifying success

- Status: Found by flow inspection
- Severity: major
- Location: frontend `src/pages/Checkout.jsx`
- Steps to reproduce: complete an order while `DELETE /cart/clear` fails.
- Expected: wait for clear/reconciliation and report any recovery action.
- Actual: clear is dispatched without awaiting its result and navigation starts
  immediately. (The cart thunk's swallowed-error portion is CART-04.)

### Checkout checks that passed before fixes

- Checkout is login-protected; guest checkout is intentionally unavailable.
- Empty item arrays, malformed product IDs, non-integer quantities, missing
  address fields, insufficient stock, and non-COD direct order methods fail.
- Server rebuilds item prices from products rather than trusting the browser.
- Only one coupon is represented in cart/checkout state (no stacking).

## Payment and post-order

### PAY-01 - Razorpay order creation is not idempotent

- Status: Found by API flow inspection; sandbox double-submit pending
- Severity: major
- Location: `POST /api/v1/payment/razorpay/order`
- Steps to reproduce: submit the same checkout twice before opening/completing
  Razorpay.
- Expected: reuse one pending payment intent/order for the checkout attempt.
- Actual: each request creates a new Razorpay order and local payment intent.

### ORDER-01 - COD stock update is non-atomic

- Status: Found by concurrent test and code inspection
- Severity: blocker
- Location: `src/controller/order.controller.js` (`PlaceOrder`)
- Steps to reproduce: concurrently order the last available units.
- Expected: stock predicate, order creation, and decrement commit together; one
  request fails when stock is exhausted.
- Actual: stock is checked before creation and later decremented with an
  unconditional `$inc`, allowing overselling or partial failure after an order
  exists.

### ORDER-02 - Order success page is lost on refresh

- Status: Found by frontend state-flow inspection; browser verification pending
- Severity: major
- Location: frontend order-success page and Redux order state
- Steps to reproduce: complete an order, open its success URL, then refresh.
- Expected: fetch the order by route ID and show confirmation.
- Actual: confirmation relies on in-memory Redux data and can no longer resolve
  the order after a refresh/direct visit.

### ORDER-03 - Order-detail cancel control does not call the cancel API

- Status: Found by frontend flow inspection
- Severity: major
- Location: frontend order detail page versus
  `PATCH /api/v1/order/:orderId/cancel`
- Steps to reproduce: open a cancellable order and press Cancel.
- Expected: API call, updated status, and restored inventory.
- Actual: only an informational popup is shown.

### ORDER-04 - No order confirmation email is implemented

- Status: Found by backend flow inspection
- Severity: minor
- Location: COD and verified Razorpay order completion
- Steps to reproduce: successfully place an order and inspect mail delivery.
- Expected: a confirmation email with order data.
- Actual: no mail service is called by either completion path.

### MONEY-01 - Coupon usage is not atomic with order success

- Status: Awaiting business approval; not changed
- Severity: major
- Location: `src/utils/order-pricing.service.js`, COD `PlaceOrder`, and Razorpay
  verification
- Steps to reproduce: apply a limited-use coupon, then force COD order creation
  or stock mutation to fail; for Razorpay, force redemption recording to fail
  after order creation.
- Expected: coupon usage and successful order commit together.
- Actual: COD can consume usage before a failed order; Razorpay can create a
  paid order while silently failing to record usage.
- Approval required: changing redemption timing affects discount entitlement
  and coupon accounting, so this is intentionally not fixed without consent.

### Payment/post-order checks that passed before fixes

- A Razorpay order is not marked paid at creation; payment status becomes Paid
  only after signature, ownership, amount/currency, and capture verification.
- Repeat verification of a completed intent returns its existing store order.
- Captured-payment/order-failure handling attempts an automatic refund.
- User B cannot read user A's order by manipulating the order URL (`403`).
- User order history is scoped by authenticated user; admin order operations
  require an allowed role.

## Cross-cutting UI and API behavior

### UI-01 - Checkout address row clips on mobile

- Status: Found in browser
- Severity: major
- Location: frontend `src/pages/Checkout.jsx`, 390x844 viewport
- Steps to reproduce: open checkout on a phone-width viewport and enter City
  and State.
- Expected: fields stack or shrink fully inside the checkout card.
- Actual: the fixed two-column flex row exceeds its container; State is clipped
  beyond the card edge.

### UI-02 - Cart totals selector emits repeated Redux stability warnings

- Status: Found in browser console
- Severity: minor
- Location: frontend `src/store/cartSlice.js` (`selectCartTotals`)
- Steps to reproduce: open product/cart/checkout in a development build and
  inspect console warnings.
- Expected: unchanged state returns the same selector reference.
- Actual: a fresh totals object is returned on every selector call, producing
  repeated React-Redux warnings and avoidable rerenders.

### Security/error checks that passed before fixes

- Admin dashboard and order-management APIs reject anonymous/non-admin users.
- Blocked/deleted account state is checked after the auth fix, not only JWT
  signature/expiry.
- Order ownership prevents user-A/user-B IDOR access.
- The global parser error fix returns JSON without stack/file-path leakage.
