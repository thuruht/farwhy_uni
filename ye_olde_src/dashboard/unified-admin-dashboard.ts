// src/dashboard/unified-admin-dashboard.ts
export function generateUnifiedDashboardHTML(user?: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Administrate Me! - Farewell/Howdy Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/css/fleeting-journey.css">
  <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
  <style>
    /* Modern Admin Dashboard Styles */
    :root {
      --admin-bg: linear-gradient(135deg, var(--magenta), var(--cyan));
      --admin-card-bg: rgba(0, 23, 31, 0.95);
      --admin-card-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);
      --admin-border-radius: 16px;
      --admin-spacing: 2rem;
    }

    body {
      background: var(--admin-bg);
      min-height: 100vh;
      font-family: var(--font-main);
      margin: 0;
      padding: 0;
    }

    /* Header Styles */
    .admin-header {
      background: rgba(0, 23, 31, 0.95);
      backdrop-filter: blur(15px);
      border-bottom: 2px solid var(--cyan);
      padding: 2rem;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .admin-header h1 {
      color: var(--base3);
      font-size: 3rem;
      margin: 0;
      font-family: var(--font-hnb2);
      text-shadow: 0 0 20px var(--cyan);
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-align: center;
    }

    .admin-header h1 span {
      color: var(--yellow);
    }

    /* Navigation Styles */
    .admin-nav {
      display: flex;
      gap: 1rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .admin-nav button {
      background: rgba(255, 255, 255, 0.1);
      color: var(--base3);
      border: 2px solid rgba(255, 255, 255, 0.2);
      padding: 1rem 2rem;
      border-radius: var(--admin-border-radius);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
      font-family: var(--font-hnm11);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .admin-nav button:hover {
      background: rgba(42, 161, 152, 0.3);
      border-color: var(--cyan);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(42, 161, 152, 0.3);
    }

    .admin-nav button.active {
      background: linear-gradient(135deg, var(--cyan), var(--blue));
      border-color: var(--cyan);
      transform: translateY(-1px);
      box-shadow: 0 8px 25px rgba(42, 161, 152, 0.4);
    }

    .logout-btn {
      background: rgba(220, 50, 47, 0.3) !important;
      border-color: var(--red) !important;
      margin-left: auto;
    }

    .logout-btn:hover {
      background: var(--red) !important;
      border-color: var(--red) !important;
      box-shadow: 0 8px 25px rgba(220, 50, 47, 0.4) !important;
    }

    /* Main Content Styles */
    .admin-main {
      padding: var(--admin-spacing);
      max-width: 1200px;
      margin: 0 auto;
    }

    .admin-section {
      display: none;
      background: var(--admin-card-bg);
      border-radius: var(--admin-border-radius);
      padding: var(--admin-spacing);
      box-shadow: var(--admin-card-shadow);
      margin-bottom: var(--admin-spacing);
    }

    .admin-section.active {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .admin-section h2 {
      color: var(--base01);
      font-size: 2rem;
      margin-bottom: 1.5rem;
      font-family: var(--font-hnb2);
      border-bottom: 3px solid var(--yellow);
      padding-bottom: 0.5rem;
    }

    /* Modern Table Styles */
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
      background: var(--base3);
      border-radius: var(--admin-border-radius);
      overflow: hidden;
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
    }

    .admin-table th {
      background: var(--base01);
      color: var(--base3);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-family: var(--font-hnm11);
    }

    .admin-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--base2);
      color: var(--base01);
    }

    .admin-table tr:hover {
      background: var(--base2);
    }

    .admin-table-actions {
      display: flex;
      gap: 0.5rem;
    }

    .admin-table-actions button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .admin-table-actions button:first-child {
      background: var(--blue);
      color: var(--base3);
    }

    .admin-table-actions button:first-child:hover {
      background: var(--cyan);
    }

    .admin-table-actions button:last-child {
      background: var(--red);
      color: var(--base3);
    }

    .admin-table-actions button:last-child:hover {
      background: var(--orange);
    }

    /* Modern Button Styles */
    .admin-btn {
      background: linear-gradient(135deg, var(--blue), var(--violet));
      color: var(--base3);
      border: none;
      padding: 1rem 2rem;
      border-radius: var(--admin-border-radius);
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-family: var(--font-hnm11);
    }

    .admin-btn:hover {
      background: linear-gradient(135deg, var(--cyan), var(--magenta));
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
    }

    .admin-btn:active {
      transform: translateY(0);
    }

    .admin-btn.secondary {
      background: var(--base2);
      color: var(--base01);
    }

    .admin-btn.secondary:hover {
      background: var(--base1);
    }

    /* Form Styles */
    .admin-form {
      background: var(--base3);
      padding: 2rem;
      border-radius: var(--admin-border-radius);
      box-shadow: var(--admin-card-shadow);
      margin-top: 2rem;
    }

    .admin-form h3 {
      color: var(--base01);
      margin-bottom: 1.5rem;
      font-family: var(--font-hnb2);
    }

    .admin-form label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--base01);
      font-family: var(--font-hnm11);
    }

    .admin-form input,
    .admin-form textarea,
    .admin-form select {
      width: 100%;
      padding: 1rem;
      border: 2px solid var(--base2);
      border-radius: 8px;
      font-size: 1rem;
      margin-bottom: 1rem;
      transition: border-color 0.3s ease;
      font-family: var(--font-main);
    }

    .admin-form input:focus,
    .admin-form textarea:focus,
    .admin-form select:focus {
      outline: none;
      border-color: var(--blue);
      box-shadow: 0 0 0 3px rgba(42, 161, 152, 0.1);
    }

    /* Flyer Upload Section Styles */
    .flyer-upload-section {
      background: rgba(42, 161, 152, 0.05);
      border: 2px dashed var(--blue);
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1rem 0;
      text-align: center;
      transition: all 0.3s ease;
    }

    .flyer-upload-section:hover {
      background: rgba(42, 161, 152, 0.1);
      border-color: var(--orange);
    }

    .flyer-upload-section input[type="file"] {
      border: none;
      background: transparent;
      padding: 0.5rem;
      margin: 0.5rem 0;
    }

    .flyer-upload-section input[type="url"] {
      margin-bottom: 0.5rem;
    }

    #flyer-preview {
      text-align: center;
      margin: 1rem 0;
    }

    #flyer-preview img {
      border: 3px solid var(--base2);
      transition: border-color 0.3s ease;
    }

    #flyer-preview img:hover {
      border-color: var(--blue);
    }

    /* Status Messages */
    .status-message {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .status-success {
      background: rgba(0, 255, 0, 0.1);
      color: var(--green);
      border: 1px solid var(--green);
    }

    .status-error {
      background: rgba(255, 0, 0, 0.1);
      color: var(--red);
      border: 1px solid var(--red);
    }

    .status-info {
      background: rgba(0, 100, 255, 0.1);
      color: var(--blue);
      border: 1px solid var(--blue);
    }

    /* Loading States */
    .loading {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid var(--base2);
      border-radius: 50%;
      border-top-color: var(--blue);
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .admin-header {
        padding: 1rem;
      }
      
      .admin-header h1 {
        font-size: 2rem;
      }
      
      .admin-nav {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .admin-main {
        padding: 1rem;
      }
      
      .admin-table-actions {
        flex-direction: column;
      }
    }

    /* Quill Editor Customization */
    .ql-editor {
      min-height: 200px;
      font-family: var(--font-main);
    }

    .ql-toolbar {
      border-top: 2px solid var(--base2);
      border-left: 2px solid var(--base2);
      border-right: 2px solid var(--base2);
    }

    .ql-container {
      border-bottom: 2px solid var(--base2);
      border-left: 2px solid var(--base2);
      border-right: 2px solid var(--base2);
    }
  </style>
</head>
<body>
  <header class="admin-header">
    <h1>ADMINISTRATE <span>FAREWELL & HOWDY!</span></h1>
    <nav class="admin-nav">
      <button id="nav-events" class="active">Events</button>
      <button id="nav-import">Import Legacy</button>
      <button id="nav-blog">Blog</button>
      <button id="nav-logout" class="logout-btn">Logout</button>
    </nav>
  </header>
  
  <main class="admin-main">
    <section id="section-events" class="admin-section active">
      <h2>Event Management</h2>
      <div id="event-list"></div>
      <button id="add-event-btn" class="admin-btn">+ Add Event</button>
      <div id="event-form-container"></div>
    </section>
    
    <section id="section-import" class="admin-section">
      <h2>Import Legacy Events</h2>
      <p>Import events from the legacy system (fygw0.kcmo.xyz)</p>
      <button id="import-legacy-btn" class="admin-btn">Import Now</button>
      <div id="import-status"></div>
    </section>
    
    <section id="section-blog" class="admin-section">
      <h2>Blog Management</h2>
      <div id="blog-list"></div>
      <button id="add-blog-btn" class="admin-btn">+ Add Post</button>
      <div id="blog-form-container"></div>
    </section>
  </main>

  <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
  <script src="/jss/admin-dashboard.js"></script>
</body>
</html>`;
}
