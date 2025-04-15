// test/fixtures/nextjs/missing-metadata.tsx
// This file is missing metadata API exports

import React from 'react';

// BAD: Page component without metadata exports - should be detected
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>This is the about page of our application.</p>
    </div>
  );
}

// Missing: export const metadata = { ... }