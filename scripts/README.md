# Farewell/Howdy Project Utilities

This directory contains utility scripts for project maintenance, deployment, and management.

## Available Scripts

### Development and Deployment

- **deploy.sh** - Deploy the application to Cloudflare Workers

  ```bash
  ./deploy.sh
  ```

- **apply-migrations.js** - Apply database migrations

  ```bash
  node apply-migrations.js
  ```

### Project Maintenance

- **commit-changes.sh** - Standardized commit workflow

  ```bash
  ./commit-changes.sh [commit_message] [description]
  ```

- **archive-legacy.sh** - Move legacy code to archive

  ```bash
  ./archive-legacy.sh [--dry-run]
  ```

- **clean_blog_posts.sh** - Clean and format blog posts

  ```bash
  ./clean_blog_posts.sh
  ```

### Security and Admin

- **generate-jwt-secret.js** - Generate a secure JWT secret

  ```bash
  node generate-jwt-secret.js
  ```

- **hash-password.js** - Generate password hash for admin users

  ```bash
  node hash-password.js 'YourPasswordHere'
  ```

## Best Practices

1. Always run scripts from the project root directory
2. Use `--dry-run` flag when available to preview changes
3. Check script output for errors before proceeding

## Adding New Scripts

When adding new scripts to this directory:

1. Include a proper shebang line (`#!/bin/bash` or `#!/usr/bin/env node`)
2. Add header documentation with usage examples
3. Make the script executable (`chmod +x script_name.sh`)
4. Update this README.md file
