// test/fixtures/vitest/incomplete-component-test.test.tsx
// This file has an incomplete test without proper assertions

import { render } from '@testing-library/react';
import { describe, it } from 'vitest';
import { Button } from '../../src/components/Button';

// BAD: Test suite without proper assertions - should be detected
describe('Button', () => {
  it('renders correctly', () => {
    // Missing expect assertions
    render(<Button>Click me</Button>);
    // Should have something like: expect(screen.getByRole('button')).toBeInTheDocument();
  });
});