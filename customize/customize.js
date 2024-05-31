let NAMES;
const App = () => {
    let create = (where, title) => {
        let deck = Q(`${where} template`).content.cloneNode(true);
        deck.Q('h2').title = title;
        Q(where).append(deck);
    }
    [1,2,3,4,5].forEach(t => create('#deck', t));
    [1,2,3,4,5].forEach(t => create('#tier div', t));
    App.events();
    App.act.events();
};
App.load = {
    saved () {
        return DB.get('user', 'pref').then(re => re && (Q('#lang').value = re.lang))
        .then(() => Promise.all([
            DB.get('user', '#deck').then(re => re?.forEach((deck, i) => 
                Q(`#deck article:nth-of-type(${i+1}) bey-x`, (bey, j) => bey.init(deck[j]))
            )),
            DB.get('user', '#tier').then(re => Object.entries(re ?? {}).forEach(([tier, beys]) =>
                Q(`#tier h2[title='${tier}']+section`).append(...beys.map(([c, p]) => [new Bey({[c]: p}), '']).flat())
            ))
        ]));
    },
    parts () {
        let bits = ['sta', 'bal', 'att', 'def'];
        let sorter = {
            blade: (p, q) => Sorter.sort.weight(p, q),
            ratchet: (p, q) => parseInt(p.abbr.split('-')[1]) - parseInt(q.abbr.split('-')[1]),
            bit: (p, q) => bits.indexOf(p.attr[0]) - bits.indexOf(q.attr[0])
        };
        return DB.get.names('blade')
        .then(names => (NAMES = names) && DB.get.parts())
        .then(async PARTS => ({...PARTS, bit: await Promise.all(PARTS.bit.map((p, _, ar) => new Part(p).revise(ar)))}))
        .then(PARTS => Object.entries(PARTS).forEach(([comp, parts]) => 
            Q(`aside .${comp}`).append(...parts
                .filter(p => comp != 'blade' || comp == 'blade' && p.names.chi)
                .sort(sorter[comp]).map((p, i) => E('li', [new Bey({[comp]: p.abbr}, {attr: p.attr, order: i})]) 
            )))
        );
    }
};
App.act = (param) => ({
    'export-image': App.act.export.image,
    'export-text': App.act.export.text,
    'delete-deck': App.act.delete
})[Q('button.selected')?.id]?.(param);
Object.assign(App.act, {
    export: {
        image (n) {
            App.act.popup('image');
            let target = Q(n ? `#deck article:nth-of-type(${n})` : '#tier div');
            target.style.background = 'black';
            !n && (target.style.minWidth = '35rem') && (target.style.maxWidth = '40rem');
            setTimeout(() => html2canvas(target, {scale: 5}).then(canvas => {
                E('a', {
                    href: canvas.toDataURL("image/png"),
                    download: n ? `DECK${n}.png` : 'TIER.png'
                }).click(); 
                target.removeAttribute('style');
            }).catch(er => console.error(er) ?? (Q('#popup').textContent = er)), 100);
        },
        text (n) {
            App.act.popup('text');
            let text = n ?
                Q(`#deck article:nth-of-type(${n}) bey-x`).map(bey => bey.name).join('\n') :
                Q('#tier article').filter(ar => ar.Q('bey-x'))
                .map(ar => `T${ar.Q('h2').title}：`+ [...ar.querySelectorAll('bey-x')].map(bey => bey.name).join('、')).join('\n');
            Q('#popup blockquote').innerText = text;
            navigator.clipboard.writeText(text);
        },
    },
    delete () {
        Q('#deck bey-x:is([blade],[ratchet],[bit])', bey => bey.classList.add('selected'));
        Q('#deck').addEventListener('click', ev => {
            ev.target.tagName == 'BEY-X' && ev.target.delete();
            Q('#deck bey-x', bey => bey.classList.remove('selected'));
            App.act.reset();
        }, {once: true})
    },
    popup (t) {
        Q(`#popup .${t}`).hidden = false;
        Q('#popup input').checked = true;
    },
    reset () {
        Q('#popup p:not([hidden])')?.setAttribute('hidden', '');
        Q('button.selected')?.classList.remove('selected');
        Q('.actioning')?.classList.remove('actioning');
    },
    events () {
        Q('#popup input').addEventListener('change', ev => ev.target.checked || App.act.reset(ev));
        Q('nav').onclick = ev => {
            if (ev.target.tagName != 'BUTTON') return;
            if (ev.target.classList.contains('selected')) return App.act.reset();
            ev.target.classList.add('selected');
            ev.target.id == 'delete-deck' && App.act();
            location.hash == '#tier' ? App.act() : Q(location.hash).classList.toggle('actioning');
        };
        Q('h2', h2 => h2.onclick = () => App.act(h2.title));
    },
});
Object.assign(App, {
    save (hash) {
        if (!App.interacted) return;
        hash == '#deck' && DB.put('user', {'#deck': Q('#deck article').map(ar => ar.Q('bey-x').map(bey => bey.string))});
        hash == '#tier' && DB.put('user', {'#tier': Q('#tier article').reduce((obj, ar) => 
            ({...obj, [ar.Q('h2').title]: [...ar.querySelectorAll('bey-x')].map(bey => bey.abbr[0])}), {})
        });
        hash || DB.put('user', {pref: {lang: Q('#lang').value}});
    },
    switch () {
        Q('main', main => main.hidden = !main.matches(location.hash ||= '#deck'));
        Object.assign(Q('nav a:nth-of-type(2)'), {
            href: location.hash == '#deck' ? '#tier' : '#deck',
            innerHTML: `<span>${location.hash == '#deck' ? 'TIER' : 'DECK'}</span>`
        });
        Q('.deck,.tier', el => el.style.display = el.classList.contains(location.hash.substring(1)) ? 'block' : 'none');

        if (location.hash == '#tier')
            return [Q('#tier bey-x')].flat().forEach(({abbr: [[p, c]]}) => Q(`aside bey-x[${p}='${c}']`).used = true);
        [Q('bey-x.used')].flat().forEach(bey => bey && (bey.used = false));
        App.interacted && Q('aside ul', App.aside.sort);
    },
    aside: {
        sort: ul => ul.append(...ul.Q('bey-x')
            .sort((b, c) => (b.classList.contains('used') - c.classList.contains('used')) || (b.order - c.order))
            .map(b => b.parentElement)
        )
    },
    events () {
        document.onpointerdown = ev => (App.interacted = true) && ev.target.closest('aside')?.classList.remove('first');
        onhashchange = App.switch;
        Q('#lang').onchange = ev => Bey.lang(ev.target.value) ?? App.save();
        this.events.observe = () => (observer => 
            Q('article,section', el => observer.observe(el, { subtree: true, childList: true, attributeFilter: Bey.observedAttributes }))
        )(new MutationObserver(() => App.save(location.hash)));

        new Dragging(Q('#deck'), {
            drop: {
                targets: 'main bey-x',
                when: ev => ev.target.classList.contains('selected')
            },
            lift: {
                drop: drop => drop.to.swap()
            }
        });
        new Dragging(Q('#tier'), {
            holdToRedispatch: pressed => pressed.select(),
            drop: {
                targets: ['#tier bey-x', '#tier section', '#tier'],
                when: ev => ev.target.classList.contains('selected')
            },
            lift: {
                drop: [
                    drop => drop.to.swap(), 
                    drop => drop.to.transfer(), 
                    (_, dragged) => {
                        let [c, p] = dragged.abbr[0];
                        dragged.remove();
                        let recovered = Q(`aside bey-x[${c}='${p}']`);
                        recovered.used = false;
                        App.aside.sort(recovered.closest('ul'));
                    },
                ]
            }
        });
        new Dragging(Q('aside'), {
            holdToRedispatch: pressed => pressed.select(),
            scroll: {
                what: 'ul',
                when: ev => !ev.target.matches('.selected'),
            },
            drop: {
                targets: ['#deck bey-x', '#tier section'],
                when: ev => ev.target.matches('.selected')
            },
            press: {
                drop () {
                    let list = Q('aside .selecting');
                    list.style.setProperty('--scrolled', list.scrollLeft);
                    Q('aside').classList.add('customizing');
                }
            },
            move: {
                scroll (drag) {
                    let [dx, dy] = [drag.moveX - drag.pressX, drag.moveY - drag.pressY], aside = Q('aside');
                    let slided = parseInt(getComputedStyle(aside).getPropertyValue('--slided') || 0);
                    if (!drag.triggered && Math.abs(dy) > 50 && Math.atan(Math.abs(dy)/Math.abs(dx)) > Math.PI/3  
                        && (slided === 0 && dy < 0 || slided === 1 || slided === 2 && dy > 0)) {
                        drag.triggered = true; 
                        slided -= Math.sign(dy);
                        aside.style.setProperty('--slided', slided);
                        Dragging.class.temp(aside, 'sliding');
                        Dragging.class.switch(`aside ul:nth-child(${slided+1})`, 'selecting');
                    }
                },
            },
            lift: {
                scroll (drag) {
                    clearTimeout(drag.timer);
                    drag.triggered = false;
                },
                drop: Object.assign([
                    (drop, dragged, targeted) => {
                        drop.to.return();
                        targeted.setAttribute(...dragged.abbr[0]);
                    },
                    (drop, dragged) => {
                        drop.to.clone();
                        dragged.used = true;
                    },
                ], {all: () => setTimeout(() => Q('.customizing')?.classList.remove('customizing'), 500)})
            }
        });
    },
});
