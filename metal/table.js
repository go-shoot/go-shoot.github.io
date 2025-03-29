import {A,E,O,Q} from 'https://aeoq.github.io/AEOQ.mjs';

class Wheel {
    constructor(name, synchrome) {
        this.name = name;
        this.synchrome = synchrome;
    }
    cells(span = true) {
        if (this.name == '/') 
            return E('td', {colSpan: span ? 2 : 1});
        if (!this.name.includes('.')) {
            let sub = /^(.+?)_(.+)$/.exec(this.name);
            return E('td', 
                sub ? [sub[1], E('sub', sub[2])] : this.name, 
                {colSpan: span ? 2 : 1, classList: sub?.[2].length > 4 || !span && (sub?.[1] ?? this.name).length > 7 ? 'long' : ''}
            );
        }
        return this.synchrome ? 
            [E('td'), E('td', {innerHTML: this.name.replace('.', '<br>'), classList: 'synchrome'})] : 
            this.name.split('.').map(p => new Wheel(p).cells(false));
    }
}
class Track {
    constructor(name) {this.name = name;}
    cells = () => this.name ? E('td', this.name == '/' ? '' : this.name) : '';
}
class Bottom {
    constructor(name) {this.name = name;}
    cells = () => E('td', this.name == '/' ? '' : this.name, this.name.includes(':') ? {colSpan: 2} : {});
}

class Row {
    constructor() {}
    create([code, type, name, synchrome]) {
        let [wheel, track, bottom] = name.split(' ');
        track.includes(':') && (bottom = track) && (track = null);
        [wheel, track, bottom] = [new Wheel(wheel, synchrome), new Track(track), new Bottom(bottom)];
                
        this.tr = E('tr', [E('td', code), wheel.cells(), track.cells(), bottom.cells()].flat(9), {
            classList: type + (['BB-31','BB-37','BB-45'].includes(code) ? ' light' : '')
        });
        this.tr.onclick = () => open(`https://www.google.com/search?q=${this.tr.textContent.replace(/^L/, '').replace(/(?<=-\d+)(?=[^0-9])/, ' ')}&udm=2`, '_blank');
        return Q('tbody').appendChild(this.tr);
    }
}
Object.assign(Row.prototype.create, Row.create);

export {Row}