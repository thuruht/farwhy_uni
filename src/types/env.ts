// src/types/env.ts
export interface Env {
  FWHY_D1: D1Database;
  FWHY_IMAGES: R2Bucket;
  SESSIONS_KV: KVNamespace;
  BLOG_KV: KVNamespace;
  ASSETS: Fetcher;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  JWT_SECRET: string;
}

export interface User {
  id?: number;
  username: string;
  password_hash?: string;
  role: 'admin' | 'thrift' | 'user';
  created_at?: string;
  updated_at?: string;
  isAdmin?: boolean; // Legacy compatibility
  authMethod?: 'jwt' | 'session'; // Legacy compatibility
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
      last_row_id?: number;
      changes?: number;
    };
  }
  
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }
  
  interface R2Bucket {
    get(key: string): Promise<R2Object | null>;
    put(key: string, value: string | ArrayBuffer, options?: { httpMetadata?: { contentType?: string; cacheControl?: string; } }): Promise<void>;
    delete(key: string): Promise<void>;
  }
  
  interface R2Object {
    readonly body: ReadableStream;
    readonly bodyUsed: boolean;
    readonly httpEtag: string;
    readonly size: number;
    writeHttpMetadata(headers: Headers): void;
  }
  
  interface Fetcher {
    fetch(request: Request): Promise<Response>;
  }
}

export interface Event {
  id: string;
  title: string;
  date: string;
  venue: 'farewell' | 'howdy';
  flyer_image_url?: string;
  ticket_url?: string;
  description?: string;
  age_restriction?: string;
  event_time?: string;
  
  // Legacy compatibility fields
  legacy_id?: string;
  legacy_image_url?: string;
  legacy_data?: string; // JSON string
  
  // Enhanced fields
  price?: string;
  capacity?: number;
  status?: 'active' | 'cancelled' | 'postponed';
  is_featured?: boolean;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
}

// Legacy event format (for backward compatibility)
export interface LegacyEvent {
  id: string;
  title?: string;
  venue?: string;
  date?: string;
  time?: string; // Maps to event_time
  imageUrl?: string; // Maps to flyer_image_url
  description?: string;
  suggestedPrice?: string; // Maps to price
  ticketLink?: string; // Maps to ticket_url
  ageRestriction?: string; // Maps to age_restriction
  [key: string]: any; // Allow any additional legacy fields
}

export interface BlogPost {
  id: string | number;
  title: string;
  content: string;
  tags?: string; // JSON array of tags
  author_id?: number;
  status?: 'published' | 'draft';
  date?: string;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  slug?: string;
}

export interface Menu {
  id: number;
  venue: 'farewell' | 'howdy';
  name: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  menu_id: number;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  id: number;
  venue: 'farewell' | 'howdy' | 'thrift';
  day_of_week: number; // 0=Sunday, 6=Saturday
  open_time?: string; // HH:MM format
  close_time?: string; // HH:MM format
  is_closed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ThriftItem {
  id: number;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  condition?: string;
  image_url?: string;
  status: 'available' | 'sold' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface ThriftContent {
  id: number;
  section: string;
  title?: string;
  content: string;
  custom_css?: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThriftSocialLink {
  id: number;
  platform: string;
  url: string;
  display_name?: string;
  icon_class?: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}
