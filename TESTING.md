# Testing Guide

This document describes the testing setup and practices for the DOU Jobs Scraper project.

## Overview

The project uses **Vitest** as the test runner for all components. We've refactored the architecture using **Dependency Injection** to improve testability.

## Test Structure

### Bot Project (`bot/`)

**Test Framework:** Vitest
**Test Files:** `src/**/__tests__/*.spec.ts`

#### Running Tests

```bash
cd bot
npm test                # Run tests once
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage report
```

### Scraper Project (`scraper/`)

**Test Framework:** Vitest with nock for HTTP mocking
**Test Files:** `src/**/__tests__/*.spec.ts`

#### Running Tests

```bash
cd scraper
npm test                # Run tests once
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage report
```

### WebApp Project (`webapp/`)

**Test Framework:** Vitest with happy-dom and @testing-library/svelte
**Test Files:** `src/**/__tests__/*.spec.ts`

#### Running Tests

```bash
cd webapp
npm test                # Run tests once
npm run test:ui         # Run tests with UI
npm run test:coverage   # Run tests with coverage report
```

## Coverage Requirements

Minimum coverage thresholds are configured in `vitest.config.ts`:

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

To view coverage:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Environment Variables for Tests

Test environments are configured in `vitest.config.ts`:

**Bot:**
- `DATABASE_URL` - Test database connection
- `TELEGRAM_BOT_TOKEN` - Test bot token
- `API_PORT` - Test API port
- `WEBAPP_URL` - Test webapp URL

**Scraper:**
- `DATABASE_URL` - Test database connection
- `BASE_URL` - DOU.ua base URL

**WebApp:**
- Uses `happy-dom` environment (no env vars needed)

## CI/CD Integration

Tests can be integrated into GitHub Actions or other CI/CD pipelines:

```yaml
- name: Run tests
  run: |
    npm run -w bot test
    npm run -w scraper test
    npm run -w webapp test
```

## Troubleshooting

### Tests fail with "Missing required environment variable"

Make sure `vitest.config.ts` has all required env vars defined in the `test.env` section.

### Tests timeout

Increase timeout in `vitest.config.ts`:

```typescript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Mock not working

Ensure you're using `vi.fn()` from Vitest and resetting mocks in `beforeEach`:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Future Improvements

- [ ] Add E2E tests for complete user flows
- [ ] Add visual regression tests for webapp
- [ ] Set up test database with docker-compose for integration tests
- [ ] Add mutation testing
- [ ] Add performance benchmarks

