navigator.serviceWorker?.register('/worker.js').then(() =>
    document.querySelector('link[href="/include/common.css"]') ?? location.reload()
);
Q = Node.prototype.Q = function(el, func) {
    let els = this.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return func ? els.forEach(func) : els.length > 1 ? [...els] : els[0];
}
const E = (el, ...stuff) => {
    let [text, attr, children] = ['String', 'Object', 'Array'].map(t => stuff.find(s => Object.prototype.toString.call(s).includes(t)));
    text && (attr = {textContent: text, ...attr ?? {}});
    el == 'img' && (attr = {alt: attr.src.match(/([^/.]+)(\.[^/.]+)$/)?.[1], onerror: ev => ev.target.remove(), ...attr ?? {}});
    el = ['svg', 'use', 'path'].includes(el) ? document.createElementNS('http://www.w3.org/2000/svg', el) : document.createElement(el);
    el.append(...children ?? []);
    Object.assign(el.style, attr?.style ?? {});
    Object.assign(el.dataset, attr?.dataset ?? {});
    return Object.assign(el, (({style, dataset, ...attr}) => attr)(attr ?? {}));
}
const Cookie = {
    set: (k, v) => document.cookie = `${k}=${typeof v == 'object' ? JSON.stringify(Cookie[k] = {...Cookie[k] ?? {}, ...v}) : Cookie[k] = v}; max-age=99999999; path=/`,
    parse: v => { try { return JSON.parse(v); } catch (e) { return console.error(v) ?? null; } }
};
Object.assign(Cookie, Object.fromEntries(document.cookie.split(/;\s?/).map(c => c.split('=')).map(([k, v]) => [k, v?.includes('{') ? Cookie.parse(v) : v])));
addEventListener('DOMContentLoaded', () => document.title += ' ■ 戰鬥陀螺 X⬧爆旋陀螺 X⬧ベイブレード X⬧Beyblade X');

const nav = links => {
    let icons = {'/': '&#xe000;', '/products/': '&#xe001;', '/prize/': '&#xe002;', '/parts/' : '&#xe003;'};
    Q('nav').replaceChildren(...links.map(l => l ? E('a', {href: l, innerHTML: icons[l] ?? ''}) : ''));
    //<!--div class=menu-scroll>
    //    <label onclick=window.scrollTo(0,0) data-icon=></label>
    //    <label onclick=window.scrollTo(0,document.body.scrollHeight) data-icon=></label>
    //</div-->`;
}

class Mapping {
    constructor(...map) {
        this.default = map.length % 2 ? map.pop() : null;
        this.map = map.reduce((pairs, item, i) => i % 2 ? pairs.at(-1).push(item) && pairs : [...pairs, [item[0] == '/' ? new RegExp(item.slice(1, -1)) : item]], []);
    }
    find = (...keys) => {
        let found, evaluate = typeof keys.at(-1) == 'boolean' && keys.pop();
        let key = keys.find(key => (found = 
            this.map.find(([k]) =>
                k instanceof RegExp && k.test(key) || k instanceof Array && k.find(item => item == key) ||
                k instanceof Function && k(key) || k == key
            )?.[1] ?? this.default
        ) != null);
        if (found instanceof Function)
            return evaluate ? found(key) : found;
        if (found instanceof Array)
            return found.map(item => typeof item == 'string' ? item.replaceAll('${}', key) : (item ?? ''));
        return found && typeof found == 'string' ? found.replaceAll('${}', key) : (found ?? '');
    }
    static maps = {};
}
let files = {
    updated: JSON.parse(localStorage.getItem('updated') || '{}'),
    stored: JSON.parse(localStorage.getItem('stored') || '{}')
}
location.pathname == '/' && fetch('/db/-update.json').then(resp => resp.json())
.then(({news, ...others}) => Object.entries(others).forEach(([url, [time]]) => files.updated[url] = new Date(time).getTime()))
.then(() => localStorage.setItem('updated', JSON.stringify(files.updated)));

const Fetch = url =>
    (files.stored[url] >= files.updated[url] ? 
        caches.match(url).then(resp => (resp && console.log(`cached: ${url}`) || resp) || Promise.reject()) :
        Promise.reject()
    ).catch(() => console.log(`fetch: ${url}`) ??
        fetch(url).then(resp => caches.open('json').then(cache => {
            cache.add(url, resp);
            localStorage.setItem('stored', JSON.stringify(files.stored = {...files.stored, [url]: new Date().getTime()}));
            return resp;
        }))
    )