/**
 * UNITY WITHIN - Entry Point Shim for Azure App Service
 * 
 * This file redirects Azure to use the main server logic in the server/ directory.
 * This ensures compatibility with environments that default to running server.js at root.
 */

import './server/server.js';
