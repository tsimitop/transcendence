import 'fastify';
import '@fastify/cookie';
import '@fastify/session';

import type { UserStateType } from "../api/sign-in/sign-in";

declare module 'fastify' {
  interface FastifyRequest {
    cookies: Record<string, string>;
    session: {
      user?: UserStateType;
    };
  }

  interface FastifyReply {
    cookie(name: string, value: any, options?: any): FastifyReply;
    clearCookie(name: string, options?: any): FastifyReply;
  }
}
