// src/types/env.ts
export interface Env {
  FWHY_D1: D1Database;
  FWHY_IMAGES: R2Bucket;
  SESSIONS_KV: KVNamespace;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD?: string;
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
