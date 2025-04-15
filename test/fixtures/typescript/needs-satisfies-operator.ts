// test/fixtures/typescript/needs-satisfies-operator.ts
// This file has type annotations that could benefit from the satisfies operator

interface Theme {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  accent?: string;
}

// BAD: Using type annotation instead of satisfies - should be detected
const darkTheme: Theme = {
  primary: '#1a1a1a',
  secondary: '#2a2a2a',
  text: '#ffffff',
  background: '#121212',
  accent: '#ff5722'
};

export default darkTheme;