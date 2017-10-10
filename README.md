### Recorder

Recorder is a tiny

### How to use it

All changes go through the `Apply` function.

```
Apply()
```

. `Apply` returns a value, this may or may not be the original value depending on whether the input is a reference (i.e. `Object` or `Array`) or an atom (i.e. `Number`, `Bool`, `String`).

```
let v = {};

let op = { type: INSERT, path : ["foo"], v : 12 };
v = Apply(v, op);
console.log(v); // { "foo" : 12 }
```

There are only three types of `D`:

* `Insert` - Insert a value into an `Object` or `Array`.
* `Update` - Set a value in an object or `Array`.
* `Delete`



The `Invert` function inverts any `D`.



let opinvert = Invert(op as D[];


    let op2 = { type: INSERT, path : ["bar"], v : { "baz" : 24 } };
    let op3 = { type: INSERT, path : ["bar", "baz"], v : "noodle" };

    
    

    v = Apply(v, op2);

    console.log(v);

    v = Apply(v, op3);

    console.log(v);

    let rev = Invert([op, op2, op3]) as D[];

    v = Apply(v, rev)

    console.log(v);
}

{
    let v = {};

    let op = { type: INSERT, path : ["foo"], v : 12 };

    v = Apply(v, op);



}