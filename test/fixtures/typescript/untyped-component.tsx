// test/fixtures/typescript/untyped-component.tsx
// This file has a component without proper TypeScript types

import React from 'react';

// BAD: Component doesn't use React.FC or a Props interface - should be detected
export function UserCard({ name, email, role }) {
  return (
    <div className="user-card">
      <h3>{name}</h3>
      <p>{email}</p>
      <span>{role}</span>
    </div>
  );
}