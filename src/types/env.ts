// src/types/env.ts
export interface Env {
  FWHY_D1: D1Database;
  FWHY_IMAGES: R2Bucket;
  SESSIONS_KV: KVNamespace;
  ASSETS: Fetcher;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
}

export interface User {
  username: string;
  isAdmin: boolean;
  authMethod: 'jwt' | 'session';
}

export type Variables = {
  user: User;
};

declare global {
  interface D1Database {
    prepare(sql: string): D1PreparedStatement;
    exec(sql: string): Promise<D1Result>;
  }
  
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first(): Promise<unknown>;
    all(): Promise<D1Result>;
    run(): Promise<D1Result>;
  }
  
  interface D1Result {
    results?: unknown[];
    success: boolean;
    meta: {
      duration: number;
      rows_read: number;
      rows_written: number;
    };
  }
  
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }
  
  interface R2Bucket {
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: string | ArrayBuffer): Promise<void>;
    delete(key: string): Promise<void>;
  }
  
  interface R2Object {
    body: ReadableStream;
    bodyUsed: boolean;
  }
  
  interface Fetcher {
    fetch(request: Request): Promise<Response>;
  }
}

export interface Event {
  id: string;
  title: string;
  date: string;
  venue: string;
  flyer_image_url?: string;
  ticket_url?: string;
  description?: string;
  age_restriction?: string;
  event_time?: string;
  created_at?: string;
}
