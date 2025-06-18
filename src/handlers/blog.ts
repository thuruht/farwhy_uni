/**
 * Blog Handler for the unified Farewell/Howdy worker
 * Manages blog posts and featured content using KV storage
 */

export async function handleBlog(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  const pathname = url.pathname;

  // Extract the action from the path
  const pathParts = pathname.split('/').filter(Boolean);
  const action = pathParts[pathParts.length - 1];

  console.log(`Blog handler - Method: ${method}, Action: ${action}, Path: ${pathname}`);

  try {
    // Public endpoints (no auth required)
    if (method === 'GET' && (action === 'posts' || pathname.endsWith('/blog/posts'))) {
      return await getPublicPosts(request, env);
    }

    if (method === 'GET' && (action === 'featured' || pathname.endsWith('/blog/featured'))) {
      return await getFeaturedContent(request, env);
    }

    // Admin endpoints (auth required)
    if (pathname.includes('/admin/')) {
      // TODO: Add auth check here when needed
      
      // Check if we're dealing with a specific post ID
      const postIdMatch = pathname.match(/\/admin\/api\/blog\/([^\/]+)$/);
      const postId = postIdMatch ? postIdMatch[1] : null;
      
      if (postId) {
        // Individual post operations
        if (method === 'GET') {
          return await getPostById(request, env, postId);
        }
        if (method === 'PUT') {
          return await updatePostById(request, env, postId);
        }
        if (method === 'DELETE') {
          return await deletePostById(request, env, postId);
        }
      } else {
        // General blog operations
        if (method === 'GET' && (action === 'posts' || action === 'blog')) {
          return await listAllPosts(request, env);
        }

        if (method === 'POST' && (action === 'posts' || action === 'blog')) {
          return await createPost(request, env);
        }

        if (method === 'PUT' && (action === 'posts' || action === 'blog')) {
          return await updatePost(request, env);
        }

        if (method === 'DELETE' && (action === 'posts' || action === 'blog')) {
          return await deletePost(request, env);
        }

        if (method === 'POST' && action === 'featured') {
          return await setFeaturedContent(request, env);
        }
      }
    }

    return new Response(JSON.stringify({ error: 'Blog endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Blog handler error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getPublicPosts(request: Request, env: any): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    const postsData = await env.BLOG_KV.get('blog:posts');
    
    if (!postsData) {
      return new Response(JSON.stringify({ data: [], total: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const posts = JSON.parse(postsData);
    
    // Filter published posts only
    const publishedPosts = posts.filter((post: any) => post.status === 'published' || !post.status);
    
    // Sort by created date (newest first)
    publishedPosts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Apply pagination
    const paginatedPosts = publishedPosts.slice(offset, offset + limit);
    
    return new Response(JSON.stringify({ 
      data: paginatedPosts,
      total: publishedPosts.length 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get public posts error:', error);
    return new Response(JSON.stringify({ data: [], total: 0 }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getFeaturedContent(request: Request, env: any): Promise<Response> {
  try {
    const featuredData = await env.BLOG_KV.get('blog:featured');
    
    if (!featuredData) {
      return new Response(JSON.stringify({ text: '', youtubeUrl: '' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const featured = JSON.parse(featuredData);
    return new Response(JSON.stringify(featured), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get featured content error:', error);
    return new Response(JSON.stringify({ text: '', youtubeUrl: '' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function listAllPosts(request: Request, env: any): Promise<Response> {
  try {
    const postsData = await env.BLOG_KV.get('blog:posts');
    
    if (!postsData) {
      return new Response(JSON.stringify({ data: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const posts = JSON.parse(postsData);
    
    // Sort by created date (newest first)
    posts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return new Response(JSON.stringify({ data: posts }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('List all posts error:', error);
    return new Response(JSON.stringify({ data: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function createPost(request: Request, env: any): Promise<Response> {
  try {
    const postData = await request.json();
    const { title, content, imageUrl } = postData;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newPost = {
      id: crypto.randomUUID(),
      title,
      content,
      image_url: imageUrl || null,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get existing posts
    const existingData = await env.BLOG_KV.get('blog:posts');
    const posts = existingData ? JSON.parse(existingData) : [];
    
    posts.push(newPost);
    
    // Save back to KV
    await env.BLOG_KV.put('blog:posts', JSON.stringify(posts));

    return new Response(JSON.stringify({ success: true, data: newPost }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create post error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updatePost(request: Request, env: any): Promise<Response> {
  try {
    const postData = await request.json();
    const { id, title, content, imageUrl } = postData;

    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existingData = await env.BLOG_KV.get('blog:posts');
    if (!existingData) {
      return new Response(JSON.stringify({ error: 'Posts not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const posts = JSON.parse(existingData);
    const postIndex = posts.findIndex((post: any) => post.id === id);
    
    if (postIndex === -1) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the post
    posts[postIndex] = {
      ...posts[postIndex],
      title: title || posts[postIndex].title,
      content: content || posts[postIndex].content,
      image_url: imageUrl !== undefined ? imageUrl : posts[postIndex].image_url,
      updated_at: new Date().toISOString()
    };
    
    // Save back to KV
    await env.BLOG_KV.put('blog:posts', JSON.stringify(posts));

    return new Response(JSON.stringify({ success: true, data: posts[postIndex] }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update post error:', error);
    return new Response(JSON.stringify({ error: 'Failed to update post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function deletePost(request: Request, env: any): Promise<Response> {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existingData = await env.BLOG_KV.get('blog:posts');
    if (!existingData) {
      return new Response(JSON.stringify({ error: 'Posts not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const posts = JSON.parse(existingData);
    const filteredPosts = posts.filter((post: any) => post.id !== id);
    
    if (filteredPosts.length === posts.length) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Save back to KV
    await env.BLOG_KV.put('blog:posts', JSON.stringify(filteredPosts));

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete post error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function setFeaturedContent(request: Request, env: any): Promise<Response> {
  try {
    const featuredData = await request.json();
    const { text, youtubeUrl } = featuredData;

    const featured = {
      text: text || '',
      youtubeUrl: youtubeUrl || '',
      updated_at: new Date().toISOString()
    };
    
    await env.BLOG_KV.put('blog:featured', JSON.stringify(featured));

    return new Response(JSON.stringify({ success: true, data: featured }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Set featured content error:', error);
    return new Response(JSON.stringify({ error: 'Failed to set featured content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getPostById(request: Request, env: any, postId: string): Promise<Response> {
  try {
    const postsData = await env.BLOG_KV.get('blog:posts');
    
    if (!postsData) {
      return new Response(JSON.stringify({ success: false, error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const posts = JSON.parse(postsData);
    const post = posts.find((p: any) => p.id === postId);
    
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, data: post }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get post by ID error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updatePostById(request: Request, env: any, postId: string): Promise<Response> {
  try {
    const updateData = await request.json();
    const postsData = await env.BLOG_KV.get('blog:posts');
    const posts = postsData ? JSON.parse(postsData) : [];
    
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex === -1) {
      return new Response(JSON.stringify({ success: false, error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update the post
    posts[postIndex] = {
      ...posts[postIndex],
      ...updateData,
      id: postId, // Ensure ID doesn't get overwritten
      updated_at: new Date().toISOString()
    };

    await env.BLOG_KV.put('blog:posts', JSON.stringify(posts));

    return new Response(JSON.stringify({ success: true, data: posts[postIndex] }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Update post by ID error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to update post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function deletePostById(request: Request, env: any, postId: string): Promise<Response> {
  try {
    const postsData = await env.BLOG_KV.get('blog:posts');
    const posts = postsData ? JSON.parse(postsData) : [];
    
    const postIndex = posts.findIndex((p: any) => p.id === postId);
    
    if (postIndex === -1) {
      return new Response(JSON.stringify({ success: false, error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove the post
    posts.splice(postIndex, 1);
    
    await env.BLOG_KV.put('blog:posts', JSON.stringify(posts));

    return new Response(JSON.stringify({ success: true, message: 'Post deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Delete post by ID error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to delete post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
