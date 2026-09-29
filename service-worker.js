const CACHE_NAME = "samson-grace-academy-v2";

const FILES_TO_CACHE = [
  "/offline/",
  "/offline/index.html",
  "/offline/service-worker.js"
];


/* ================================
   INSTALL
================================ */

self.addEventListener("install", event => {

  console.log("Installing offline cache...");

  event.waitUntil(

    caches.open(CACHE_NAME).then(cache => {

      return cache.addAll(FILES_TO_CACHE);

    })

  );

  self.skipWaiting();

});


/* ================================
   ACTIVATE
================================ */

self.addEventListener("activate", event => {

  console.log("Offline service worker activated.");

  event.waitUntil(

    Promise.all([

      self.clients.claim(),

      caches.keys().then(cacheNames => {

        return Promise.all(

          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))

        );

      })

    ])

  );

});


/* ================================
   FETCH
================================ */

self.addEventListener("fetch", event => {

  const request = event.request;

  /*
   * ONLY handle HTTP/HTTPS requests.
   *
   * This prevents errors from things like:
   * chrome-extension://
   */

  if (
    request.method !== "GET" ||
    (request.url.startsWith("http://") === false &&
     request.url.startsWith("https://") === false)
  ) {

    return;

  }


  /*
   * Only handle requests belonging
   * to our GitHub Pages site.
   */

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {

    return;

  }


  event.respondWith(

    fetch(request)

      .then(response => {

        /*
         * Cache successful website requests.
         */

        if (
          response &&
          response.status === 200
        ) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {

              cache.put(request, copy);

            });

        }

        return response;

      })

      .catch(() => {

        /*
         * Internet is unavailable.
         *
         * Try the cached version.
         */

        return caches.match(request)

          .then(cachedResponse => {

            if (cachedResponse) {

              return cachedResponse;

            }


            /*
             * If the requested page isn't cached,
             * show index.html.
             */

            return caches.match(
              "/offline/index.html"
            );

          });

      })

  );

});
