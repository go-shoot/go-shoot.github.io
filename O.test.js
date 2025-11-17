class O extends Map {
  constructor(...objs) {
    super();
    objs.flatMap(obj => [...obj[Symbol.iterator] ? obj : Object.entries(obj)]).forEach(([p, v]) => super.set(p, v));

    return new Proxy(this, {
      get: (target, p) =>
        typeof p === 'string' && !Reflect.has(target, p) ? target.get(p) :
          [Symbol.iterator, 'entries', 'keys', 'values', 'forEach'].includes(p) ?
            Reflect.get(target, p).bind(target) : Reflect.get(target, p),

      set: (target, p, v) =>
        typeof p === 'string' && !Reflect.has(target, p) ?
          super.set(p, v) : Reflect.set(target, p, v),

      ownKeys: target => [...target.keys()],

      getOwnPropertyDescriptor: (target, p) => 
        Reflect.getOwnPropertyDescriptor(target, p) || typeof p === 'string' && target.has(p) ? {
          value: target.get(p),
          enumerable: true,
          configurable: true
        } : null
    });
  }
  [Symbol.toPrimitive] (type) {return type == 'string' && [...this.keys()].join('');}
  at(path) {
    return (typeof path == 'string' ? path.split('.') : path).reduce((obj, key) => obj?.[key], this);
  }
  set(path, v) {
    path = typeof path == 'string' ? path.split('.') : path;
    path.length > 1 ? this.at(path.slice(0, -1))[path.at(-1)] = v : super.set(path[0], v);
    return this;
  }
  find(...targets) {
    if (targets.length === 1 && targets[0] instanceof Function) //.find(([k,v]))
            return [...this].find(targets[0]);

    let options = (targets.at(-1).evaluate || targets.at(-1).default) && targets.pop(), found = {};
    found.v = [...this].find(([k]) => (found.k = targets.find(t =>
      k instanceof RegExp && k.test(t) || k instanceof Array && k.find(item => item == t) ||
      k instanceof Function && k(t) || k == t
    )) != null)?.[1];
    found.k ??= targets[0];
    found.v ??= options?.default;
    return found.v instanceof Function && options?.evaluate ? found.v(found.k) : found.v;
  }
  flatten(transformation) {
    let result = new O({});
    let enter = (current, oldPath = []) => {
      if (current && (current instanceof O || Object.getPrototypeOf(current) == Object.prototype)) {
        new O(current).each(([key, value]) => enter(value, oldPath.concat(key)));
      } else {
        let newPath = transformation([...oldPath]).filter(k => k);
        newPath.some(k => k.includes('undefined')) && (newPath = oldPath);
        let level = result;
        newPath.forEach((key, i) => level = level[key] ??= i == newPath.length - 1 ? current : new O({}));
      }
    }
    enter(this);
    return result;
  }
  each(f) { this.forEach((v, k) => f([k, v])); }
  groupBy(...arg) { return new O(Object.groupBy(this, ...arg)).map(([k, v]) => [k, new O(v)]); }

  add(...objs) { return this.map(([k, v]) => [k, v + objs.reduce((sum, o) => sum += o?.[k] ?? 0, 0)]); }
  minus(...objs) { return this.map(([k, v]) => [k, v - objs.reduce((sum, o) => sum += o?.[k] ?? 0, 0)]); }
  append(...objs) { return this.map(([k, v]) => [k, v + objs.reduce((sum, o) => sum += o?.[k] ?? '', '')]); }
  prepend(...objs) { return this.map(([k, v]) => [k, objs.reduce((sum, o) => (o?.[k] ?? '') + sum, '') + v]); }

  url() { return new URLSearchParams(this).toString(); }
}
['map','filter'].forEach(f => O.prototype[f] = function(...p) {return new O([...this][f](...p));});
['flatMap','every'].forEach(f => O.prototype[f] = function(...p) {return [...this][f](...p);});

let o=new O({a:5,b:3,c:new O({d:7,b:9,c:new O({vv:0,bb:2})})},new O([['a',7],['d',-2]]),{d:-9});
o.set('c.c.bb',8)
o.set('c.c.hh',8)
let r=new O([[/^a/,5],[[5,6,7],6],[/^b/,s=>s+'nu']])
test('', () => expect(o.a).toBe(7));
test('', () => expect(o.d).toBe(-9));
test('', () => expect(o['a']).toBe(7));
test('', () => expect(o.size).toBe(4));
test('', () => {o.f=0;expect(o.f).toBe(0)});
test('', () => {o.f=0;expect([...o][4]).toStrictEqual(['f',0])});
test('', () => {o.f=null;expect([...o.values()][4]).toStrictEqual(null)});
test('', () => expect(o.at('c.c.vv')).toBe(0));
test('', () => expect(o.at('c.c.bb')).toBe(8));
test('', () => expect(o.at('c.c.hh')).toBe(8));
test('', () => expect(r.find('a')).toBe(5));
test('', () => expect(r.find('6')).toBe(6));
test('', () => expect(r.find('bu',{evaluate:true})).toBe('bunu'));
test('', () => expect(new O({a:5}).add({a:6},{a:7}).a).toStrictEqual(18));
test('', () => expect(new O({a:'b'}).prepend({a:'e'},{a:'c'}).a).toStrictEqual('ceb'));
test('', () => expect(o.flatten(([l1,l2,...deeper])=>[`${l1}.${l2}`,...deeper])['c.d']).toStrictEqual(7));
test('', () => expect(new O({a:5,b:6}).url()).toStrictEqual('a=5&b=6'));
test('', () => expect(new O({CX:'.'}).find(([,char])=>'.'==char)).toStrictEqual(['CX','.']));
test('', () => expect(`${new O({c:5,b:6})}`).toStrictEqual('cb'));
test('', () => expect({...new O({a:5,b:6})}).toStrictEqual({a:5,b:6}));
test('', () => expect([...new O({a:5,b:6})]).toStrictEqual([['a',5],['b',6]]));
class A {
  #arr; #obj;
  constructor(...stuff) {
    let { true: objs, false: others } = Object.groupBy(stuff, s => Object.getPrototypeOf(s) == Object.prototype);
    this.#arr = [...others ?? []].flat();
    this.#obj = Object.assign({}, ...objs ?? []);

    return new Proxy(this, {
      get: (target, p) =>
        p === Symbol.iterator ? function* () { yield* target.#arr; } :
        /^\d+$/.test(p) ? target.#arr[Number(p)] :
        p in target.#obj ? target.#obj[p] :
        p == 'length' ? target.#arr[p] : Reflect.get(target, p)
      ,
      set: (target, p, v) =>
        /^\d+$/.test(p) ? target.#arr[Number(p)] = v :
        typeof p === 'string' ? target.#obj[p] = v : Reflect.set(target, p, v)
      ,
      ownKeys: target => Object.keys(target.#obj),
      getOwnPropertyDescriptor: (target, p) =>
        p in target.#obj ? {
          value: target.#obj[p],
          enumerable: true,
          configurable: true
        } : null
    });
  }
  push(...objs) { return Object.assign(this, ...objs); }
  static already(...stuff) {
    let { true: already, false: others } = Object.groupBy(stuff, s => s instanceof A);
    return already ? Object.assign(already[0], ...others ?? []) : new A(...stuff);
  }
}
['map', 'filter'].forEach(f => A.prototype[f] = function (...p) { return new A([...this][f](...p), { ...this }); });
let cc = new A(['a','b','c'], {a:55, b:66}, {c:77});
cc[1]='d';cc[3]=0;cc.b=77;cc.d=0;
test('', () => expect([...cc]).toStrictEqual(['a','d','c',0]));
test('', () => expect({...cc}).toStrictEqual({a:55,b:77,c:77,d:0}));
test('', () => expect(A.already(cc,{f:88,i:55},{s:22}).s).toStrictEqual(22));
test('', () => expect([...cc.map(_=>_+2)]).toStrictEqual(['a2','d2','c2',2]));
test('', () => expect(cc.push({c:88}).c).toStrictEqual(88));
test('', () => expect(new O({...cc}).c).toStrictEqual(88));
//test('', () => expect([...cc.map(_=>_+2)]).toStrictEqual([]));

