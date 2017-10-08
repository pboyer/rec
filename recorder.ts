
type O = { [key: string] : any };
type A = any[];
type V = O | A | string | number | boolean;
type I = string | number;

export type UPDATE = 'UPDATE';
export const UPDATE : UPDATE = 'UPDATE';
type Update = { type : UPDATE, path? : I[], v : V, old? : V };

export type INSERT = 'INSERT';
export const INSERT : INSERT = 'INSERT';
type Insert = { type : INSERT, path? : I[], v : V, old? : V };

export type DELETE = 'DELETE';
export const DELETE : DELETE = 'DELETE';
type Delete = { type : DELETE, path? : I[], old? : V };

type D = Update | Insert | Delete;

function Apply(v : V, d : D | D[]) : V {
    if (d instanceof Array){
        for (let id of d){
            v = Apply(v, id);
        }
        return v;
    }

    switch (d.type) {
    case UPDATE: {
        if (!d.path) {
            d.old = v;
            return d.v;
        }
        
        let path = d.path, dest = v;
        for (let i = 0, l = path.length - 1; i < l; i++) {
            dest = dest[path[i]];
        }

        let i = path[path.length-1];
        d.old = dest[i];
        dest[i] = d.v;
        return v;
    }
    case INSERT: {
        if (!d.path) {
            d.old = v;
            return d.v;
        }
        
        let path = d.path, dest = v;
        for (let i = 0, l = path.length - 1; i < l; i++) {
            dest = dest[path[i]];
        }

        let i = path[path.length-1];
        d.old = null;

        if (dest instanceof Array) {
            // todo check it's a number
            dest.splice(i as number, 1, d.v);
        } else {
            dest[i] = d.v;
        }

        return v;
    }
    case DELETE: {
        if (!d.path) {
            d.old = v;
            return null;
        }
        
        let path = d.path, dest = v;
        for (let i = 0, l = path.length - 1; i < l; i++) {
            dest = dest[path[i]];
        }

        let i = path[path.length-1];
        d.old = dest[i];

        if (dest instanceof Array) {
            dest.splice(i as number, 1);
        } else {
            delete(dest[i]);
        }

        return v;
    }
    }
}

function Invert(d : D[] | D) : D[] | D {
    if (d instanceof Array){
        let dn = d.map(Invert);
        dn.reverse();
        return dn as D[];
    }

    switch (d.type) {
        case UPDATE:
            return {
                type: UPDATE,
                path : d.path,
                v : d.old,
                old : d.v
            };
        case INSERT:
            return {
                type: DELETE,
                path : d.path,
                v : d.old,
                old : d.v
            };
        case DELETE: {
            return {
                type: INSERT,
                path : d.path,
                v : d.old,
                old : null
            };
        }
    }
}