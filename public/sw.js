// This is a minimal service worker file.
// Its presence and successful registration are what's required for a web app to be considered installable by Chrome.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Skip waiting is not strictly necessary for this minimal case,
  // but it's good practice for faster updates in the future.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Claiming clients immediately allows the service worker to control any open clients
  // that fall within its scope.
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // This minimal service worker doesn't intercept any fetch requests.
  // It just lets the browser handle them as it normally would.
  // This is the key to "existing" without implementing complex caching.
  return;
});