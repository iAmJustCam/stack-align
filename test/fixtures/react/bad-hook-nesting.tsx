// test/fixtures/react/bad-hook-nesting.tsx
// This file contains a conditional hook usage violation

import { useEffect, useState } from 'react';

export function DemoComponent({ condition }: { condition: boolean }) {
  const [count, setCount] = useState(0);
  
  // BAD: Hook in a conditional - should be detected
  if (condition) {
    useEffect(() => {
      console.log('This hook is in a conditional!');
    }, []);
  }
  
  return <div data-testid="demo-component">{count}</div>;
}