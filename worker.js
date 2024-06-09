self.addEventListener('install', ev => {
    self.skipWaiting();
    caches.delete('BBX');
    ev.waitUntil(Head.cache());
});
self.addEventListener('activate', ev => ev.waitUntil(clients.claim()));
self.addEventListener('fetch', ev => ev.respondWith(
    (is.internal(ev.request.url) ? caches.match(ev.request, {ignoreSearch: true}) : Promise.resolve())
    .then(cached => cached ? fetch.net(ev.request) && Head.add(cached) : fetch.net(ev.request))
    .catch(console.error)
));

const is = {
    internal: url => 'go-shoot.github.io' == new URL(url).host,
    parts: url => /img\/.+?\/.+?\.png$/.test(url),
    cacheable: url => is.internal(url) && !/\.json$/.test(new URL(url).pathname),
}
fetch.net = req => {
    /css|js|json$/.test(req.url) && (req.url += `?${Math.random()}`);
    return fetch(req).then(res => 
        (res.status == 200 && is.cacheable(req.url) ? fetch.cache(res) : Promise.resolve(res))
        .then(Head.add)
    ).catch(console.error);
}
fetch.cache = res => caches.open(is.parts(res.url) ? 'parts' : 'V3').then(cache => cache.put(res.url.replace(/[?#].*$/, ''), res.clone()))

const Head = {
    url: '/include/head.html',
    code: `<!DOCTYPE HTML>
    <meta charset=UTF-8>
    <meta name=viewport content='width=device-width,initial-scale=1'>
    <meta name=theme-color content='#b0ff50'>
    <link rel=stylesheet href=/include/common.css>
    <link rel=apple-touch-icon href=/favicon.ico>
    <link rel=manifest href='data:application/manifest+json,{
      "name":"非官方資訊站",
      "display":"standalone",
      "start_url":"https://go-shoot.github.io/",
      "theme_color":"rgb(181,251,92)",
      "background_color":"black",
      "icons":[{"src":"https://go-shoot.github.io/favicon.png","type":"image/png","sizes":"192x192"},{"src":"https://go-shoot.github.io/favicon.ico","type":"image/png","sizes":"512x512","purpose":"maskable"}]
    }'>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-MJMB14RTQP"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MJMB14RTQP');
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Yusei+Magic&family=IBM+Plex+Sans+JP:wght@500&display=swap" rel="stylesheet">
    <script src=/include/DB.js></script>
    <script src=/include/UX.js></script>
    `,
    cache: () => caches.open('V3').then(cache => cache.put(Head.url, new Response(Head.code))),
    fetch: () => caches.match(Head.url).then(resp => resp.text()),

    add: async resp => (resp?.headers.get('content-type') || '').includes('text/html') ? 
        new Response(await Head.fetch() + await resp.text(), Head.response(resp)) : resp,
            
    response: ({status, statusText, headers}) => ({status, statusText, headers})
}