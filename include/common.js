navigator.serviceWorker?.register('/worker.js').then(() =>
    document.querySelector('link[href$="common.css"]') ?? location.reload()
);
Q = Node.prototype.Q = function(el, func) {
    let els = this.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return func ? els.forEach(func) : els.length > 1 ? [...els] : els[0];
}
Node.prototype.sQ = function(el) {return this.shadowRoot.Q(el);}
const E = (el, ...stuff) => {
    let [text, attr, children] = ['String', 'Object', 'Array'].map(t => stuff.find(s => Object.prototype.toString.call(s).includes(t)));
    text && (attr = {textContent: text, ...attr ?? {}});
    el == 'img' && (attr &&= {alt: attr.src.match(/([^/.]+)(\.[^/.]+)$/)?.[1], onerror: ev => ev.target.remove(), ...attr ?? {}});
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
addEventListener('DOMContentLoaded', () => {
    document.title += ' ■ 戰鬥陀螺 X⬧爆旋陀螺 X⬧ベイブレード X⬧Beyblade X';
    Q('[popover]')?.addEventListener('click', ev => ev.target.closest('[popover]').hidePopover());
});

const nav = links => {
    let icons = {'/': '&#xe000;', '/products/': '&#xe001;', '/prize/': '&#xe002;', '/parts/' : '&#xe003;'};
    Q('nav').replaceChildren(...links.map(l => l ? E('a', {href: l, innerHTML: icons[l] ?? ''}) : ''));
}

class Mapping {
    constructor(...map) {
        this.default = map.length % 2 ? map.pop() : null;
        this.map = map.reduce((map, item, i, ar) => i % 2 === 0 ? map.set(item, ar[i + 1]) : map, new Map());
    }
    find = (...keys) => {
        let found, evaluate = typeof keys.at(-1) == 'boolean' && keys.pop();
        let key = keys.find(key => (found = 
            this.map.entries().find(([k]) =>
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