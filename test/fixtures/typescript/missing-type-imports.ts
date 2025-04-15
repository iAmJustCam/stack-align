// test/fixtures/typescript/missing-type-imports.ts
// This file has regular imports that should be type imports

import { User, Role } from './types';
import { ApiResponse } from '../api/types';

// These imported types are only used in type positions
interface UserProfile {
  user: User;
  role: Role;
  apiResponse?: ApiResponse;
}

export function getUserProfile(id: string): Promise<UserProfile> {
  return fetch(`/api/users/${id}`)
    .then(response => response.json());
}