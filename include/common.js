Q = Node.prototype.Q = function(el, func) {
    let els = this.querySelectorAll?.(el) ?? document.querySelectorAll(el);
    return func ? els.forEach(func) : els.length > 1 ? [...els] : els[0];
}
Node.prototype.sQ = function(el) {return this.shadowRoot.Q(el);}

Q('head').insertAdjacentHTML('beforeend', `<style id=unsupported>
    html::before {
        content:'請重新整理\\A如問題持續，需更新／換瀏覽器';
        opacity:1; transition:opacity .5s,1s;
        z-index:1;
        background:black; color:white; font-size:3em;
        white-space:pre-wrap;
        position:fixed; width:100%; height:100%;
        display:flex; justify-content:center; align-items:center;
    }
    @starting-style {html::before {opacity:0;}}
    </style>`);
navigator.serviceWorker?.register('/worker.js').then(() => {
    if (!Q('link[href$="common.css"]')) return console.log(0)??Promise.reject();
    document.title += ' ■ 戰鬥陀螺 X⬧爆旋陀螺 X⬧ベイブレード X⬧Beyblade X';console.log(1);
    Q('#unsupported')?.remove();
}).catch(() => location.reload());

addEventListener('DOMContentLoaded', () => {
    let menu = Q('nav menu');
    if (menu) {
        menu.append(E('li', [E('a', {href: '/', innerHTML: '&#xe000;'})]));
        let hashchange = () => {
            Q('menu .current')?.classList.remove('current');
            Q('menu li[data-href]').find(li => new URL(li.dataset.href, document.baseURI).href == location.href)?.classList.add('current');
        };
        addEventListener('hashchange', hashchange);
        hashchange();
        new Dragging(menu, {
            what: 'nav menu',
            translate: {x: {max: menu => menu.offsetLeft*-1 - 6}, y: false},
            move: drag => drag.to.select(0),
            lift (drop, dragged) {
                dragged.Q('.selected') && (location.href = dragged.Q('.selected').dataset.href);
                drop.to.return();
            }
        });
    }
    Q('[popover]')?.addEventListener('click', ev => ev.target.closest('[popover]').hidePopover());
});
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

class Mapping {
    constructor(...map) {
        this.default = map.length % 2 ? map.pop() : null;
        this.map = new Map(map.flatMap((item, i, ar) => i % 2 ? [] : [[item, ar[i + 1]]]));
    }
    find = (...keys) => {
        let found, evaluate = typeof keys.at(-1) == 'boolean' && keys.pop();
        let key = keys.find(key => (found = 
            [...this.map.entries()].find(([k]) =>
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
