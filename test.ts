import * as rec from './rec'

let v = {};

let stringKeys : rec.I[] = ['foo', 'bar', 'baz', 'frobnitz', 'bam', 'boom', 'fizz', 'buzz', 'a', 'b', 'c'];
let numbKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

let keys = stringKeys.concat(numbKeys);

let seed = 2;

function rand() {
    return seed = (seed + seed * 13) % 31;
}

function randString() : rec.I {
    return keys[rand() % stringKeys.length];
}

function randKey() : rec.I {
    return keys[rand() % keys.length];
}

function randBool() {
    return rand() % 2 === 0;
}

function randN(n : number) {
    return rand() % n;
}

function randObject(maxWidth: number, maxDepth : number) {
    function innerRandObject(depth : number) {
        if (depth >= maxDepth) return innerRandAtom();

        depth++;

        if (randBool() && depth != 1) return innerRandArray(depth);

        let o = {};
        for (let i = 0, l = randN(maxWidth); i < maxWidth; i++) {
            o[randKey()] = innerRandObject(depth);
        }
       return o;
    }

    function innerRandArray(depth : number) {
        depth++;
        let a = [];

        for (let i = 0, l = randN(maxWidth); i < l; i++) {
            a.push(innerRandObject(depth))
        }
    
        return a;
    }
    
    function innerRandAtom() {
        switch (randN(3)) {
        case 0:
            return rand();
        case 1:
            return randString();
        case 2:
            return randBool();
        }
    }

    return innerRandObject(0);
}

function randLegalChange() {
    
}


// remove support for tracking non-object
// randomObject
// randomChangeFromObject

// start from non-zero state
// move to a valid, new state via a random change

console.log(JSON.stringify(randObject(3, 5), null, '  '));

