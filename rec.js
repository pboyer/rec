"use strict";
exports.__esModule = true;
exports.UPDATE = 'UPDATE';
exports.INSERT = 'INSERT';
exports.DELETE = 'DELETE';
exports.COMPOUND = 'COMPOUND';
function Apply(o, d) {
    switch (d.type) {
        case exports.UPDATE: {
            var path = d.path, dest = o;
            for (var i_1 = 0, l = path.length - 1; i_1 < l; i_1++) {
                dest = dest[path[i_1]];
            }
            var i = path[path.length - 1];
            d.old = dest[i];
            dest[i] = d.v;
            return o;
        }
        case exports.INSERT: {
            var path = d.path, dest = o;
            for (var i_2 = 0, l = path.length - 1; i_2 < l; i_2++) {
                dest = dest[path[i_2]];
            }
            var i = path[path.length - 1];
            if (dest instanceof Array) {
                dest.splice(i, 0, d.v);
            }
            else {
                d.old = dest[i]; // an object insert may overwrite the key
                dest[i] = d.v;
            }
            return o;
        }
        case exports.DELETE: {
            var path = d.path, dest = o;
            for (var i_3 = 0, l = path.length - 1; i_3 < l; i_3++) {
                dest = dest[path[i_3]];
            }
            var i = path[path.length - 1];
            d.old = dest[i];
            if (dest instanceof Array) {
                dest.splice(i, 1);
            }
            else {
                delete (dest[i]);
            }
            return o;
        }
        case exports.COMPOUND: {
            for (var i = 0, l = d.ds.length; i < l; i++)
                Apply(o, d.ds[i]);
            return d;
        }
    }
}
exports.Apply = Apply;
function Invert(d) {
    switch (d.type) {
        case exports.UPDATE:
            return {
                type: exports.UPDATE,
                path: d.path,
                v: d.old,
                old: d.v
            };
        case exports.INSERT:
            // This field is non-empty when the client tries to insert a value into 
            // an Object where the key was already defined.
            if (d.old !== undefined) {
                return {
                    type: exports.UPDATE,
                    path: d.path,
                    v: d.old,
                    old: d.v
                };
            }
            return {
                type: exports.DELETE,
                path: d.path,
                old: d.v
            };
        case exports.DELETE:
            return {
                type: exports.INSERT,
                path: d.path,
                v: d.old,
                old: null
            };
        case exports.COMPOUND: {
            var ds = d.ds.map(Invert);
            ds.reverse();
            return {
                type: exports.COMPOUND,
                ds: ds
            };
        }
    }
}
exports.Invert = Invert;
