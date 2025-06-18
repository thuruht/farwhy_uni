// src/dashboard/unified-admin-dashboard.ts
export function generateUnifiedDashboardHTML(user?: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Farewell/Howdy Admin Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/css/fleeting-journey.css">
  <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
  <style>
    /* Extra admin-specific tweaks */
    .admin-nav {
      display: flex;
      gap: 2rem;
      justify-content: center;
      margin-bottom: 2.5rem;
    }
    .admin-nav button {
      font-size: 1.1rem;
      background: var(--yellow);
      color: var(--base3);
      border: 2px solid var(--base02);
      box-shadow: 4px 4px 0px var(--base02);
      border-radius: 0.5rem;
      padding: 0.75rem 2rem;
      margin-bottom: 0;
      transition: all 0.1s;
    }
    .admin-nav button.active, .admin-nav button:hover {
      background: var(--orange);
      color: var(--base3);
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0px var(--base02);
    }
    .logout-btn {
      float: right;
      background: var(--red);
      color: var(--base3);
      border: 2px solid var(--base02);
      box-shadow: 4px 4px 0px var(--base02);
      border-radius: 0.5rem;
      padding: 0.5rem 1.2rem;
      font-size: 1rem;
      font-weight: bold;
      margin-top: -3.5rem;
      margin-right: 1rem;
    }
    .logout-btn:hover {
      background: var(--base01);
      color: var(--red);
    }
    .admin-section {
      display: none;
    }
    .admin-section.active {
      display: block;
    }
    .admin-table-actions button {
      margin-right: 0.5rem;
    }
    .import-status {
      margin-top: 1rem;
      font-size: 1.1em;
      color: var(--violet);
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>Farewell & Howdy <span style="color: var(--violet);">Admin</span> Dashboard</h1>
    <nav class="admin-nav">
      <button id="nav-events" class="active">Events</button>
      <button id="nav-import">Import Legacy</button>
      <button id="nav-blog">Blog</button>
      <button id="nav-logout" class="logout-btn">Logout</button>
    </nav>
  </header>
  <main>
    <section id="section-events" class="admin-section active card">
      <h2>Event Management</h2>
      <div id="event-list"></div>
      <button id="add-event-btn" class="btn">+ Add Event</button>
      <div id="event-form-container" style="margin-top:2rem;"></div>
    </section>
    <section id="section-import" class="admin-section card">
      <h2>Import Legacy Events</h2>
      <button id="import-legacy-btn" class="btn">Import Now</button>
      <div id="import-status" class="import-status"></div>
    </section>
    <section id="section-blog" class="admin-section card">
      <h2>Blog Management</h2>
      <div id="blog-list"></div>
      <button id="add-blog-btn" class="btn">+ Add Post</button>
      <div id="blog-form-container" style="margin-top:2rem;"></div>
    </section>
  </main>
  <footer class="footer">
    <p>Made with ☕, 🎸, and a dash of <span style="color: var(--magenta);">quirk</span> by the Farewell/Howdy team.</p>
  </footer>
  <script src="https://cdn.quilljs.com/1.3.7/quill.js"></script>
  <script src="/jss/admin-dashboard.js"></script>
</body>
</html>
`;
}
