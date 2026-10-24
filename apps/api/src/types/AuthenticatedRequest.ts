import { Request } from 'express';
import { MemberRole } from 'restaurant-core';

export interface Identity {
  memberId: string;
  name: string;
  role: MemberRole;
  token: string;
}

export interface AuthenticatedRequest extends Request {
  identity: Identity;
}
