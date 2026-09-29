/*
 * Samson Grace Academy
 * Offline Service Worker
 */

const CACHE_NAME = "samson-grace-academy-v1";


/*
 * Everything we want available offline.
 */

const FILES_TO_CACHE = [

  "/offline/",

  "/offline/index.html",

  "/offline/service-worker.js"

];


/*
 * INSTALL
 */

self.addEventListener("install", event => {

  console.log("Installing offline cache...");

  event.waitUntil(

    caches.open(CACHE_NAME)

      .then(cache => {

        return cache.addAll(FILES_TO_CACHE);

      })

  );

  /*
   * Activate immediately.
   */

  self.skipWaiting();

});


/*
 * ACTIVATE
 */

self.addEventListener("activate", event => {

  console.log("Offline service worker activated.");

  event.waitUntil(

    Promise.all([

      self.clients.claim(),

      /*
       * Remove old caches.
       */

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


/*
 * FETCH
 *
 * Try the internet first.
 *
 * If the internet doesn't work,
 * use the cached version.
 */

self.addEventListener("fetch", event => {

  event.respondWith(

    fetch(event.request)

      .then(response => {

        /*
         * Save successful requests
         * into the offline cache.
         */

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {

          const responseClone =
            response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                responseClone
              );

            });

        }

        return response;

      })

      .catch(() => {

        /*
         * Internet failed.
         * Look for a cached copy.
         */

        return caches.match(event.request)

          .then(cachedResponse => {

            if (cachedResponse) {

              return cachedResponse;

            }

            /*
             * If the requested page isn't cached,
             * return index.html.
             */

            return caches.match(
              "/offline/index.html"
            );

          });

      })

  );

});
