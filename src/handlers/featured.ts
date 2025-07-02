// src/handlers/featured.ts
import { Context } from 'hono';
import { Env } from '../types/env';

type FeaturedAction = 'get' | 'list' | 'create' | 'update' | 'delete';

// Main handler function for featured content API
export async function handleFeatured(c: Context<{ Bindings: Env }>, action: FeaturedAction) {
  const { BLOG_KV } = c.env;
  
  switch (action) {
    case 'get':
    case 'list':
      return getFeaturedContent(c);
    case 'create':
    case 'update':
      return updateFeaturedContent(c);
    case 'delete':
      return deleteFeaturedContent(c);
    default:
      return c.json({ success: false, error: "Invalid action" }, 400);
  }
}

// Get featured content (videos, posts, etc.)
async function getFeaturedContent(c: Context<{ Bindings: Env }>) {
  const { BLOG_KV } = c.env;
  
  try {
    // Get featured content from KV store
    const featuredData = await BLOG_KV.get('featured');
    
    // Parse JSON or initialize empty object
    const featured = featuredData ? JSON.parse(featuredData) : {};
    
    return c.json({ 
      success: true, 
      data: featured 
    });
  } catch (error) {
    console.error('Error getting featured content:', error);
    return c.json({ 
      success: false, 
      error: "Failed to retrieve featured content" 
    }, 500);
  }
}

// Update featured content
async function updateFeaturedContent(c: Context<{ Bindings: Env }>) {
  const { BLOG_KV } = c.env;
  
  try {
    // Get request body
    const body = await c.req.json();
    
    // Get current featured content
    const featuredData = await BLOG_KV.get('featured');
    const featured = featuredData ? JSON.parse(featuredData) : {};
    
    // Update with new content
    const updatedFeatured = {
      ...featured,
      ...body,
      updated_at: new Date().toISOString()
    };
    
    // Save to KV store
    await BLOG_KV.put('featured', JSON.stringify(updatedFeatured));
    
    return c.json({ 
      success: true, 
      data: updatedFeatured 
    });
  } catch (error) {
    console.error('Error updating featured content:', error);
    return c.json({ 
      success: false, 
      error: "Failed to update featured content" 
    }, 500);
  }
}

// Delete featured content
async function deleteFeaturedContent(c: Context<{ Bindings: Env }>) {
  const { BLOG_KV } = c.env;
  
  try {
    const id = c.req.param('id');
    
    if (!id) {
      return c.json({ success: false, error: "ID required for deletion" }, 400);
    }
    
    // Get current featured content
    const featuredData = await BLOG_KV.get('featured');
    const featured = featuredData ? JSON.parse(featuredData) : {};
    
    // Remove the specified item (you can customize this logic based on your data structure)
    if (featured.youtube && Array.isArray(featured.youtube)) {
      featured.youtube = featured.youtube.filter((item: any) => item.id !== id);
    }
    
    // Save updated data back to KV store
    await BLOG_KV.put('featured', JSON.stringify(featured));
    
    return c.json({ success: true, message: "Featured content deleted" });
  } catch (error) {
    console.error('Error deleting featured content:', error);
    return c.json({ 
      success: false, 
      error: "Failed to delete featured content" 
    }, 500);
  }
}
