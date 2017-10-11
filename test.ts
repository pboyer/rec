import * as rec from './rec'
import { stringifyStable } from './stringify'

// There are a bunch of functions here for determinisitic generation of random data

let stringKeys : rec.I[] = ['foo', 'bar', 'baz', 'frobnitz', 'bam', 'boom', 'fizz', 'buzz', 'a', 'b', 'c'];
let numbKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

let keys = stringKeys.concat(numbKeys);

export class Rand {
    private seed: number;
    constructor(seed: number) { this.seed = seed; }
    next(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    nextIntInRange(min: number, max: number): number {
        const diff = max - min;
        return (this.next() * diff) | 0 + min;
    }

    nextFloatInRange(min: number, max: number): number {
        const diff = max - min;
        return this.next() * diff + min;
    }
}

let rando = new Rand(1);

let MIN_INT = (1<<31)-1;
let MAX_INT = -(1<<31);

function randPosInt() {
    return rando.nextIntInRange(0, MAX_INT);
}

function randString() : rec.I {
    return keys[randPosInt() % stringKeys.length];
}

function randKey() : rec.I {
    return keys[randPosInt() % keys.length];
}

function randBool() {
    return randPosInt() % 2 === 0;
}

function randN(n : number) {
    return randPosInt() % n;
}

function randObject(maxWidth: number, maxDepth : number) {
    function innerRandObject(depth : number) {
        if (depth >= maxDepth) return innerRandAtom();

        depth++;
 
        if (depth != 1 && randBool()) return innerRandArray(depth);

        const o = {};
        for (let i = 0, l = randN(maxWidth); i < maxWidth; i++) {
            o[randKey()] = innerRandObject(depth);
        }
       return o;
    }

    function innerRandArray(depth : number) {
        depth++;
        
        const a = [];
        for (let i = 0, l = randN(maxWidth); i < l; i++) {
            a.push(innerRandObject(depth))
        }
        return a;
    }
    
    function innerRandAtom() {
        switch (randN(3)) {
        case 0:
            return randPosInt();
        case 1:
            return randString();
        case 2:
            return randBool();
        }
    }

    return innerRandObject(0);
}

const NUM_D = 3;

function randD(root : rec.O) : rec.D {   
    function innerRandPath(v : rec.V, allowInserts : boolean) : rec.I[] {
        if (v instanceof Array) {
            if (v.length === 0) return [];

            const index = innerRandArrayIndex(v);
            return [index].concat(
                innerRandPath(v[index], allowInserts)
            ); 
        } else if (typeof v === 'number') {
            return [];
        } else if (typeof v === 'boolean') {
            return [];
        } else if (typeof v === 'string') {
            return [];
        }

        const empty = numObjectKeys(v) === 0;
        if (empty && !allowInserts) {
            return [];
        }

        if (allowInserts) {
            if (empty || randN(NUM_D) === 0) {
                return [randString()];
            }
        }

        const key = innerRandObjectKey(v);
        return [key].concat(
            innerRandPath(v[key], allowInserts)
        );
    }

    function numObjectKeys(o : rec.O) {
        let numKeys = 0;
        for (let k in o) numKeys++;
        return numKeys;
    }

    function innerRandObjectKeyTryInsert(o : rec.O) : rec.I {
        const numTries = 3;
        let key;
        for (let i = 0; i < numTries; i++) {
            key = randString();
            if (o[key] === undefined) {
                return key;
            }
        }
        return key;
    }

    function innerRandObjectKey(o : rec.O) : rec.I {
        const numKeys = numObjectKeys(o);
        const keyMax = randN(numKeys);

        let i = 0;
        for (let k in o) {
            if (i === keyMax) {
                return k
            }
            i++;
        }

        throw new Error("Bug in randObjectKey")
    }

    function innerRandArrayIndex(a : rec.A) : rec.I {
        if (a.length === 0) throw new Error("Cannot find index of length 0 array");
        return randN(a.length);
    }

    const randV = () => randObject(randN(3), randN(2));

    switch (randN(NUM_D)) {
    case 0:
        return {
            type: rec.UPDATE,
            path: innerRandPath(root, false),
            v: randV()
        };
    case 1:
        return {
            type: rec.INSERT,
            path: innerRandPath(root, true),
            v: randV()
        };
    case 2:
        return {
            type: rec.DELETE,
            path: innerRandPath(root, false)
        };
    }
}

function format(v : any) {
    return JSON.stringify(v, null, '  ')
}

function print(v : any) {
    console.log(format(v));
}

// Single test

// This test generates a random object, applies a random change, applies the inverse change, 
// and then checks the object has returned to its original state.
{
    const trials = 1 << 10;
    const subTrials = 1 << 10;

    for (let i = 0; i < trials; i++) {
        const o = randObject(5, 5);
    
        for (let j = 0; j < subTrials; j++) {
            let d, di, s0, s1, s2;
    
            try {
                d = randD(o);
                s0 = stringifyStable(o);
    
                rec.Apply(o, d);
                s1 = stringifyStable(o);
    
                di = rec.Invert(d);
    
                rec.Apply(o, di);
                s2 = stringifyStable(o);
    
                if (s2 !== s0) {
                    throw new Error("BeforeD and AfterD do not match!");
                }
            } catch (e) {
                throw new Error(`At trial ${i}, subtrial ${j}: ${e}
    
        D:  
        ${format(d)}
    
        DInvert:  
        ${format(di)}
    
        BeforeD:
        ${s0}
    
        AfterD:
        ${s1}
    
        AfterDInvert:
        ${s2}`)
            }
        }
    }
}

// Compound test

// This test generates a random object, applies a large number of changes sequentially, inverts 
// them all as a Compound, then checks the object is back to its original state. 
{
    const trials = 1 << 10;
    const numDs = 1 << 10;

    for (let i = 0; i < trials; i++) {
        const o = randObject(5,5);
        const s0 = stringifyStable(o);
        const ds = [];
        let s1, s2;

        try {
            for (let j = 0; j < numDs; j++) {
                const d = randD(o);
                ds.push(d);
                rec.Apply(o, d);
            }

            s1 = stringifyStable(o);

            const comp = { 
                type: rec.COMPOUND,
                ds: ds
            };

            const compi = rec.Invert(comp);

            rec.Apply(o, compi);
            s2 = stringifyStable(o);

            if (s2 !== s0) {
                throw new Error("BeforeD and AfterD do not match!");
            }
        } catch (e) {
            throw new Error(`At trial ${i}: ${e}

BeforeD:
${ JSON.stringify(JSON.parse(s0), null, ' ') }

AfterD:
${ JSON.stringify(JSON.parse(s1), null, ' ') }

AfterDInvert:
${ JSON.stringify(JSON.parse(s2), null, ' ') }`)
        }
    }
};

