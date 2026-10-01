
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa', // Changed to SPA to handle routing automatically in dev
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from the dist directory
    app.use(express.static(path.resolve(__dirname, 'dist')));

    // Catch-all route to serve index.html for SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer();
