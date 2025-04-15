// test/fixtures/tailwind/directional-classes.tsx
// This file uses directional classes instead of logical properties

import React from 'react';

export function Card({ title, content }: { title: string; content: string }) {
  return (
    // BAD: Using directional classes instead of logical properties - should be detected
    <div className="rounded-lg shadow-md p-4 mb-4 ml-4 mr-4">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-gray-700">{content}</p>
    </div>
  );
}