"use strict";
exports.__esModule = true;
var rec = require("./rec");
var stringify_1 = require("./stringify");
// There are a bunch of functions here for determinisitic generation of random data
var stringKeys = ['foo', 'bar', 'baz', 'frobnitz', 'bam', 'boom', 'fizz', 'buzz', 'a', 'b', 'c'];
var numbKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
var keys = stringKeys.concat(numbKeys);
var Rand = (function () {
    function Rand(seed) {
        this.seed = seed;
    }
    Rand.prototype.next = function () {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    };
    Rand.prototype.nextIntInRange = function (min, max) {
        var diff = max - min;
        return (this.next() * diff) | 0 + min;
    };
    Rand.prototype.nextFloatInRange = function (min, max) {
        var diff = max - min;
        return this.next() * diff + min;
    };
    return Rand;
}());
exports.Rand = Rand;
var rando = new Rand(1);
var MIN_INT = (1 << 31) - 1;
var MAX_INT = -(1 << 31);
function randPosInt() {
    return rando.nextIntInRange(0, MAX_INT);
}
function randString() {
    return keys[randPosInt() % stringKeys.length];
}
function randKey() {
    return keys[randPosInt() % keys.length];
}
function randBool() {
    return randPosInt() % 2 === 0;
}
function randN(n) {
    return randPosInt() % n;
}
function randObject(maxWidth, maxDepth) {
    function innerRandObject(depth) {
        if (depth >= maxDepth)
            return innerRandAtom();
        depth++;
        if (depth != 1 && randBool())
            return innerRandArray(depth);
        var o = {};
        for (var i = 0, l = randN(maxWidth); i < maxWidth; i++) {
            o[randKey()] = innerRandObject(depth);
        }
        return o;
    }
    function innerRandArray(depth) {
        depth++;
        var a = [];
        for (var i = 0, l = randN(maxWidth); i < l; i++) {
            a.push(innerRandObject(depth));
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
var NUM_D = 3;
function randD(root) {
    function innerRandPath(v, allowInserts) {
        if (v instanceof Array) {
            if (v.length === 0)
                return [];
            var index = innerRandArrayIndex(v);
            return [index].concat(innerRandPath(v[index], allowInserts));
        }
        else if (typeof v === 'number') {
            return [];
        }
        else if (typeof v === 'boolean') {
            return [];
        }
        else if (typeof v === 'string') {
            return [];
        }
        var empty = numObjectKeys(v) === 0;
        if (empty && !allowInserts) {
            return [];
        }
        if (allowInserts) {
            if (empty || randN(NUM_D) === 0) {
                return [randString()];
            }
        }
        var key = innerRandObjectKey(v);
        return [key].concat(innerRandPath(v[key], allowInserts));
    }
    function numObjectKeys(o) {
        var numKeys = 0;
        for (var k in o)
            numKeys++;
        return numKeys;
    }
    function innerRandObjectKeyTryInsert(o) {
        var numTries = 3;
        var key;
        for (var i = 0; i < numTries; i++) {
            key = randString();
            if (o[key] === undefined) {
                return key;
            }
        }
        return key;
    }
    function innerRandObjectKey(o) {
        var numKeys = numObjectKeys(o);
        var keyMax = randN(numKeys);
        var i = 0;
        for (var k in o) {
            if (i === keyMax) {
                return k;
            }
            i++;
        }
        throw new Error("Bug in randObjectKey");
    }
    function innerRandArrayIndex(a) {
        if (a.length === 0)
            throw new Error("Cannot find index of length 0 array");
        return randN(a.length);
    }
    var randV = function () { return randObject(randN(3), randN(2)); };
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
function format(v) {
    return JSON.stringify(v, null, '  ');
}
function print(v) {
    console.log(format(v));
}
// Single test
// This test generates a random object, applies a random change, applies the inverse change, 
// and then checks the object has returned to its original state.
{
    var trials = 1 << 10;
    var subTrials = 1 << 10;
    for (var i = 0; i < trials; i++) {
        var o = randObject(5, 5);
        for (var j = 0; j < subTrials; j++) {
            var d = void 0, di = void 0, s0 = void 0, s1 = void 0, s2 = void 0;
            try {
                d = randD(o);
                s0 = stringify_1.stringifyStable(o);
                rec.Apply(o, d);
                s1 = stringify_1.stringifyStable(o);
                di = rec.Invert(d);
                rec.Apply(o, di);
                s2 = stringify_1.stringifyStable(o);
                if (s2 !== s0) {
                    throw new Error("BeforeD and AfterD do not match!");
                }
            }
            catch (e) {
                throw new Error("At trial " + i + ", subtrial " + j + ": " + e + "\n    \n        D:  \n        " + format(d) + "\n    \n        DInvert:  \n        " + format(di) + "\n    \n        BeforeD:\n        " + s0 + "\n    \n        AfterD:\n        " + s1 + "\n    \n        AfterDInvert:\n        " + s2);
            }
        }
    }
}
// Compound test
// This test generates a random object, applies a large number of changes sequentially, inverts 
// them all as a Compound, then checks the object is back to its original state. 
{
    var trials = 1 << 10;
    var numDs = 1 << 10;
    for (var i = 0; i < trials; i++) {
        var o = randObject(5, 5);
        var s0 = stringify_1.stringifyStable(o);
        var ds = [];
        var s1 = void 0, s2 = void 0;
        try {
            for (var j = 0; j < numDs; j++) {
                var d = randD(o);
                ds.push(d);
                rec.Apply(o, d);
            }
            s1 = stringify_1.stringifyStable(o);
            var comp = {
                type: rec.COMPOUND,
                ds: ds
            };
            var compi = rec.Invert(comp);
            rec.Apply(o, compi);
            s2 = stringify_1.stringifyStable(o);
            if (s2 !== s0) {
                throw new Error("BeforeD and AfterD do not match!");
            }
        }
        catch (e) {
            throw new Error("At trial " + i + ": " + e + "\n\nBeforeD:\n" + JSON.stringify(JSON.parse(s0), null, ' ') + "\n\nAfterD:\n" + JSON.stringify(JSON.parse(s1), null, ' ') + "\n\nAfterDInvert:\n" + JSON.stringify(JSON.parse(s2), null, ' '));
        }
    }
}
;
