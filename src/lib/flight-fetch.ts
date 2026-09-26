import { BASE_PATH } from "@/lib/base-path";

/**
 * Static export hosts answer `/route/?_rsc=` with `index.html`. The App Router
 * then feeds that HTML to the flight decoder, which never settles, so the
 * navigation transition never commits. Rewrite those GETs onto the prebuilt
 * `index.txt` flight file before the request leaves the page. Already-static
 * `.txt` prefetches (and hashed `/_next/static/` assets) are left alone.
 * Search params other than `_rsc` stay on the URL so the rendered-search
 * check still matches.
 */
export const flightFetchBoot = `(function(){
  var native = window.fetch.bind(window);
  var base = ${JSON.stringify(BASE_PATH + "/")};
  window.fetch = function(input, init){
    try {
      var req = input instanceof Request ? input : null;
      var raw = req ? req.url : (input instanceof URL ? input.href : String(input));
      var url = new URL(raw, location.href);
      if (url.origin === location.origin && url.pathname.indexOf(base) === 0) {
        var method = ((init && init.method) || (req && req.method) || "GET").toUpperCase();
        var headers = (init && init.headers) || (req && req.headers) || null;
        var rsc = url.searchParams.has("_rsc");
        if (!rsc && headers) {
          if (typeof headers.get === "function") rsc = headers.get("RSC") === "1";
          else rsc = headers.RSC === "1" || headers.rsc === "1";
        }
        var path = url.pathname;
        if (method === "GET" && rsc && path.indexOf("/_next/static/") === -1 && !path.endsWith(".txt")) {
          url.pathname = path.endsWith("/") ? path + "index.txt" : path + ".txt";
          if (req) return native(new Request(url, req));
          return native(url, init);
        }
      }
    } catch (e) {}
    return native(input, init);
  };
})();`;
