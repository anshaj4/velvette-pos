import app from '../server/server.js';

export default function handler(req, res) {
  // Ensure req.url matches Express routes
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
}
