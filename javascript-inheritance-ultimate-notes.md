# JavaScript Inheritance — Complete, Exhaustive Guide

> **JavaScript has ONLY prototype-based inheritance.** Classes (ES6+) are syntactic sugar over prototypes, not genuine classical inheritance like Java or C++.

This is a **definitive, one-stop reference** covering every detail, edge case, exception, and nuance of inheritance in JavaScript.

---

## Table of Contents
1. [Core Concepts](#1-core-concepts)
2. [Prototype-Based Inheritance Patterns](#2-prototype-based-inheritance-patterns)
3. [Prototype Chain Mechanics](#3-prototype-chain-mechanics)
4. [Constructor Function Inheritance](#4-constructor-function-inheritance)
5. [ES6 Class Inheritance](#5-es6-class-inheritance)
6. [super() — Complete Rules & Edge Cases](#6-super--complete-rules--edge-cases)
7. [Static Members (Methods & Properties)](#7-static-members-methods--properties)
8. [Private Members (#)](#8-private-members-)
9. [Protected-Like Pattern (Conventions)](#9-protected-like-pattern-conventions)
10. [Extending Built-in Objects](#10-extending-built-in-objects)
11. [Mixins & Multiple Inheritance Simulation](#11-mixins--multiple-inheritance-simulation)
12. [Composition vs Inheritance](#12-composition-vs-inheritance)
13. [Edge Cases & Pitfalls](#13-edge-cases--pitfalls)
14. [Property Lookup, Shadowing & Deletion](#14-property-lookup-shadowing--deletion)
15. [Getters & Setters in Inheritance](#15-getters--setters-in-inheritance)
16. [Symbols in Inheritance](#16-symbols-in-inheritance)
17. [WeakMaps for Privacy Pre-ES2022](#17-weakmaps-for-privacy-pre-es2022)
18. [Performance Considerations](#18-performance-considerations)
19. [Debugging & Introspection](#19-debugging--introspection)
20. [Common Mistakes & Best Practices](#20-common-mistakes--best-practices)
21. [Historical Context & Evolution](#21-historical-context--evolution)

---

## 1. Core Concepts

### What is Inheritance in JavaScript?

Inheritance allows an object to access properties and methods from another object (its **prototype**). This enables code reuse without duplication.

### The Prototype Slot: `[[Prototype]]`

Every object (except `null`) has an internal, non-enumerable slot called `[[Prototype]]`:
- **Not** accessible directly via `.prototype` (that's for functions)
- **Can be** accessed/modified via:
  - `Object.getPrototypeOf(obj)` (read)
  - `Object.setPrototypeOf(obj, proto)` (write, slow)
  - `obj.__proto__` (getter/setter, deprecated but works)
  - Object literal: `{ __proto__: parent }`

```js
const parent = { greeting: "Hello" };
const child = Object.create(parent);

console.log(Object.getPrototypeOf(child) === parent); // true
console.log(child.__proto__ === parent);              // true (deprecated but works)
```

### Key Distinction: `__proto__` vs `.prototype`

| Property | What It Is | Example |
|----------|-----------|---------|
| `obj.__proto__` | Getter/setter for `[[Prototype]]` of an instance | `const child = {}; child.__proto__ = parent;` |
| `Constructor.prototype` | Property on any function; used to set `[[Prototype]]` of instances created with `new` | `function Person() {}; Person.prototype.greet = function() {};` |

```js
function Person(name) {
  this.name = name;
}

// Person.prototype is an object used for inheritance
Person.prototype.greet = function() {
  console.log(`Hello, ${this.name}`);
};

const p1 = new Person("Alice");
console.log(Object.getPrototypeOf(p1) === Person.prototype); // true
console.log(p1.__proto__ === Person.prototype);              // true
```

### Key Axiom: Every Object Inherits from Object.prototype

Unless explicitly broken with `Object.create(null)`, all objects inherit from `Object.prototype`, which provides:
- `toString()`
- `hasOwnProperty()`
- `propertyIsEnumerable()`
- `toLocaleString()`
- `valueOf()`
- etc.

```js
const obj = {};
console.log(Object.getPrototypeOf(obj) === Object.prototype); // true

// Exception: null-prototype objects
const noProto = Object.create(null);
console.log(Object.getPrototypeOf(noProto)); // null
console.log(noProto.hasOwnProperty); // undefined (not inherited)
```

### Arrow Functions & `.prototype`

**Arrow functions do NOT have a `.prototype` property** and cannot be used as constructors:

```js
const ArrowFunc = () => {};
console.log(ArrowFunc.prototype); // undefined

new ArrowFunc(); // ❌ TypeError: ArrowFunc is not a constructor

// Regular functions DO have .prototype
function RegularFunc() {}
console.log(RegularFunc.prototype); // { constructor: RegularFunc }
new RegularFunc(); // ✔ Works
```

---

## 2. Prototype-Based Inheritance Patterns

### Pattern 2.1: Object-to-Object with `Object.create()` (Recommended)

Creates a new object with a specified prototype:

```js
const parent = {
  greet() {
    console.log("Hello from parent");
  }
};

const child = Object.create(parent);
child.name = "Alice";

child.greet(); // "Hello from parent"
console.log(child.hasOwnProperty("greet")); // false (inherited)
console.log(child.hasOwnProperty("name"));  // true (own property)
```

#### `Object.create()` with Property Descriptors

Second argument accepts property descriptors (like `Object.defineProperty`):

```js
const parent = { greet() { console.log("Hi"); } };

const child = Object.create(parent, {
  age: {
    value: 25,          // Initial value
    writable: true,     // Can be changed
    enumerable: true,   // Will appear in Object.keys()
    configurable: true  // Can be redefined/deleted
  },
  id: {
    value: "12345",
    writable: false,    // Read-only
    enumerable: false   // Hidden from Object.keys()
  }
});

console.log(child.age);        // 25
console.log(Object.keys(child)); // ["age"] (id is not enumerable)
child.id = "999";              // ❌ Silent fail (non-writable)
```

**Exception:** In strict mode, assigning to a non-writable property throws a `TypeError`:

```js
"use strict";
const obj = Object.create(null, {
  readonly: { value: 100, writable: false }
});
obj.readonly = 200; // ❌ TypeError: Cannot assign to read only property
```

### Pattern 2.2: Dynamic Prototype Change with `Object.setPrototypeOf()`

Changes an existing object's prototype:

```js
const parent = { greet() { console.log("Hello"); } };
const child = { name: "Bob" };

Object.setPrototypeOf(child, parent);
child.greet(); // "Hello"
```

**Performance Warning:** Changing prototypes after object creation invalidates V8 and SpiderMonkey optimizations. Avoid in hot paths:

```js
// ❌ Slow pattern
const obj = {};
Object.setPrototypeOf(obj, expensiveProto); // Deoptimizes

// ✔ Fast pattern
const obj = Object.create(expensiveProto); // Optimized from the start
```

### Pattern 2.3: Using `__proto__` (Deprecated—Avoid)

While it works, `__proto__` is deprecated and can cause issues:

```js
const parent = { greet() { console.log("Hi"); } };

const child = {
  __proto__: parent  // Works but deprecated
};

child.greet(); // "Hi"
```

**Why avoid:**
- Performance penalty (slower than `Object.create()`)
- Mutable prototypes lead to subtle bugs
- Deprecated in favor of `Object.create()` and `Object.setPrototypeOf()`
- Can cause security issues in some contexts

---

## 3. Prototype Chain Mechanics

### The Lookup Process

When you access `obj.prop`, JavaScript:
1. **Checks `obj` itself** for an own property named `prop`
2. **If found**, returns the value
3. **If not found**, checks `Object.getPrototypeOf(obj)` for the property
4. **Repeats** up the chain until the property is found or the chain ends at `null`
5. **If not found anywhere**, returns `undefined`

```js
const grandparent = { type: "Grand" };
const parent = Object.create(grandparent);
parent.name = "Parent";

const child = Object.create(parent);
child.age = 10;

// Lookup for child.type:
// 1. Check child: no 'type' property
// 2. Check parent: no 'type' property
// 3. Check grandparent: yes! 'type' = "Grand"
console.log(child.type); // "Grand"

// Lookup for child.age:
// 1. Check child: yes! 'age' = 10
console.log(child.age); // 10
```

### Visual Chain

```
child { age: 10 }
  ↓ [[Prototype]]
parent { name: "Parent" }
  ↓ [[Prototype]]
grandparent { type: "Grand" }
  ↓ [[Prototype]]
Object.prototype { toString, ... }
  ↓ [[Prototype]]
null
```

### Chain Depth and Performance

**Deep chains slow down property lookups:**

```js
const a = { val: "a" };
const b = Object.create(a);
const c = Object.create(b);
const d = Object.create(c);
const e = Object.create(d);
const f = Object.create(e);

// Accessing f.val requires 5 lookups
console.log(f.val); // "a" (slow, 5-level chain)
```

**Engine Optimization:** V8 and SpiderMonkey inline lookups if chains are stable and shallow. **Keep chains 2-3 levels max** for performance.

### Write Behavior: Creating Own Properties

Writes **always create/modify own properties** on the target object, never the prototype chain:

```js
const parent = { count: 0 };
const c1 = Object.create(parent);
const c2 = Object.create(parent);

console.log(c1.count); // 0 (from parent)

c1.count = 5;
console.log(c1.count); // 5 (own property)
console.log(c2.count); // 0 (still from parent)
console.log(parent.count); // 0 (unchanged)
```

**Exception:** Setter in prototype:

```js
const parent = {
  _value: 0,
  set value(v) { this._value = v; } // Setter
};

const child = Object.create(parent);
child.value = 10; // Invokes setter!

console.log(child._value); // 10 (setter set own property)
```

### Cyclic Prototypes Are Forbidden

You **cannot** create circular prototype chains; the engine prevents it:

```js
const a = {};
const b = {};

Object.setPrototypeOf(b, a);
Object.setPrototypeOf(a, b); // ❌ TypeError: Cyclic __proto__ value
```

---

## 4. Constructor Function Inheritance

This is the **pre-ES6 pattern**; classes are syntactic sugar over it.

### Basic Constructor Function

```js
function Person(name) {
  this.name = name; // Instance property
}

Person.prototype.greet = function() {
  console.log(`Hello, ${this.name}`);
};

const p = new Person("Alice");
p.greet(); // "Hello, Alice"
console.log(p instanceof Person); // true
```

**What happens with `new`:**
1. Creates a new empty object: `{}`
2. Sets its `[[Prototype]]` to `Person.prototype`
3. Calls `Person.call(newObj, args)` (runs constructor with `this = newObj`)
4. Returns `newObj` (unless constructor explicitly returns an object)

### Inheritance: Borrowing the Constructor & Linking Prototypes

```js
function Person(name) {
  this.name = name;
}
Person.prototype.sayName = function() {
  console.log(this.name);
};

function Student(name, rollNo) {
  Person.call(this, name); // Borrow constructor: set this.name
  this.rollNo = rollNo;    // Add child property
}

Student.prototype = Object.create(Person.prototype); // Link prototypes
// IMPORTANT: Fix constructor reference
Student.prototype.constructor = Student;

Student.prototype.study = function() {
  console.log(`${this.name} is studying`);
};

const s = new Student("Bob", 101);
s.sayName(); // "Bob"
s.study();   // "Bob is studying"
console.log(s instanceof Student); // true
console.log(s instanceof Person);  // true
```

**Why is each line needed:**

| Line | Purpose |
|------|---------|
| `Person.call(this, name)` | Runs `Person`'s instance setup on `Student` instance; copies instance properties |
| `Student.prototype = Object.create(Person.prototype)` | Links prototypes so `Student` instances inherit `Person` methods |
| `Student.prototype.constructor = Student` | Fixes broken constructor pointer (see next section) |

### The `.constructor` Property Pitfall

When you assign `Student.prototype = Object.create(Person.prototype)`, the `constructor` property is lost:

```js
function Person(name) { this.name = name; }
function Student(name, roll) {
  Person.call(this, name);
  this.roll = roll;
}

Student.prototype = Object.create(Person.prototype);
console.log(Student.prototype.constructor === Person); // ❌ true (WRONG)

// Fix it:
Student.prototype.constructor = Student;
console.log(Student.prototype.constructor === Student); // ✔ true
```

**Why does this matter?**
- Some libraries/frameworks use `.constructor` to determine the type
- Some ORM/serialization libraries rely on it
- It's semantically correct for introspection

**If forgotten, you can still use `instanceof`, but introspection breaks:**

```js
const s = new Student("Alice", 101);

console.log(s.constructor === Student);  // false (wrong!)
console.log(s.constructor === Person);   // true (misleading)
console.log(s instanceof Student);       // true (correct)
console.log(s instanceof Person);        // true (correct)

// Broken introspection:
const copy = new s.constructor("Bob", 202); // Actually creates a Person, not Student!
console.log(copy instanceof Student); // false (oops)
```

### Avoiding Constructor Borrowing (Where Possible)

If you don't need instance properties from the parent, you can skip `Person.call(this, ...)`:

```js
function Animal() {}
Animal.prototype.eat = function() { console.log("Eating"); };

function Dog() {}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function() { console.log("Woof"); };

const d = new Dog();
d.eat();  // "Eating"
d.bark(); // "Woof"
```

But if parent initializes things, **you must** borrow the constructor:

```js
function Vehicle(brand) {
  this.brand = brand; // Parent sets this
}

function Car(brand, model) {
  Vehicle.call(this, brand); // MUST borrow to set this.brand
  this.model = model;
}

Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

const c = new Car("Toyota", "Camry");
console.log(c.brand);  // "Toyota" (set by Vehicle.call)
console.log(c.model);  // "Camry"
```

---

## 5. ES6 Class Inheritance

Classes are **syntactic sugar** over constructor functions and prototypes. Under the hood, they use the same mechanisms as section 4.

### Basic Class & Inheritance

```js
class Person {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, ${this.name}`);
  }
}

class Student extends Person {
  constructor(name, rollNo) {
    super(name); // Must call super first
    this.rollNo = rollNo;
  }

  study() {
    console.log(`${this.name} is studying`);
  }
}

const s = new Student("Alice", 101);
s.greet(); // "Hello, Alice"
s.study(); // "Alice is studying"
```

**What `class ... extends` does:**
1. Sets `Student.prototype = Object.create(Person.prototype)`
2. Automatically fixes `Student.prototype.constructor = Student`
3. Allows `super()` calls (no equivalent in pre-ES6)

### Classes Are NOT Hoisted

Unlike function declarations, class declarations are hoisted but remain in a **temporal dead zone** until the declaration is reached:

```js
console.log(typeof Person); // "undefined" (not available)

class Person {}

console.log(typeof Person); // "function" (now available)
```

Compare with function declarations:

```js
console.log(typeof greeting); // "function" (hoisted)

function greeting() { console.log("Hi"); }
```

This makes class declarations safer—you cannot accidentally use a class before defining it.

### Class Properties (Fields) vs Methods

**Methods** go on the prototype (efficient, shared across instances):

```js
class Person {
  greet() { console.log("Hi"); } // On Person.prototype
}

const p = new Person();
console.log(p.hasOwnProperty("greet")); // false (inherited)
```

**Properties (fields)** (ES2022+) become own properties on the instance:

```js
class Person {
  name = "Bob"; // Own property on each instance
  age = 30;     // Own property on each instance
}

const p = new Person();
console.log(p.hasOwnProperty("name")); // true
console.log(p.hasOwnProperty("age"));  // true
```

**Memory implication:** Fields consume memory per instance; methods are shared. Use fields for instance-specific state, methods for behavior.

### Class Expressions

Classes can also be expressions:

```js
const PersonClass = class {
  constructor(name) {
    this.name = name;
  }
  greet() {
    console.log(`Hello, ${this.name}`);
  }
};

const p = new PersonClass("Bob");
p.greet(); // "Hello, Bob"
```

---

## 6. super() — Complete Rules & Edge Cases

`super()` is a special syntax that allows child classes to call parent methods/constructors. It **only works in classes**, not in constructor functions.

### Rule 1: `super()` in Constructors (Must Be First)

If a child class extends a parent and has a constructor, **`super()` must be called before accessing `this`:**

```js
class Base {
  constructor(x) {
    this.x = x;
  }
}

class Child extends Base {
  constructor(x, y) {
    super(x); // MUST be first
    this.y = y;
  }
}

const c = new Child(10, 20);
console.log(c.x); // 10
console.log(c.y); // 20
```

**Why?** The child instance isn't fully initialized until `super()` runs. Accessing `this` before `super()` is a `ReferenceError` (temporal dead zone):

```js
class Bad extends Base {
  constructor(x, y) {
    console.log(this); // ❌ ReferenceError: Must call super first
    super(x);
  }
}
```

### Rule 2: `super()` is Optional ONLY if Child Has No Constructor

If child doesn't define a constructor, `super()` is automatically called implicitly:

```js
class Base {
  constructor() {
    this.x = 10;
  }
}

class Child extends Base {
  // No constructor defined; super() is called automatically
}

const c = new Child();
console.log(c.x); // 10
```

Equivalent to:

```js
class Child extends Base {
  constructor(...args) {
    super(...args); // Implicit
  }
}
```

### Rule 3: `super()` with Multiple Arguments

Pass arguments to parent constructor:

```js
class Vehicle {
  constructor(brand, model) {
    this.brand = brand;
    this.model = model;
  }
}

class Car extends Vehicle {
  constructor(brand, model, year) {
    super(brand, model);
    this.year = year;
  }
}

const car = new Car("Toyota", "Camry", 2023);
console.log(car.brand); // "Toyota"
console.log(car.model); // "Camry"
console.log(car.year);  // 2023
```

### Rule 4: `super.method()` Calls Parent Method

```js
class Parent {
  greet() {
    console.log("Hello from parent");
  }
}

class Child extends Parent {
  greet() {
    super.greet(); // Call parent's greet
    console.log("and child");
  }
}

new Child().greet();
// Output:
// Hello from parent
// and child
```

**Exception:** You **cannot use `super` inside arrow functions** (they don't have their own `super` binding):

```js
class Child extends Parent {
  greet() {
    const arrow = () => {
      super.greet(); // ❌ SyntaxError: 'super' keyword is unexpected here
    };
  }
}
```

Use regular methods instead:

```js
class Child extends Parent {
  greet() {
    this._callParent(); // Use helper method
  }

  _callParent() {
    super.greet(); // ✔ Works in regular method
  }
}
```

### Rule 5: `super` in Static Methods

Static methods can also use `super` to call parent static methods:

```js
class Base {
  static info() {
    console.log("Base static");
  }
}

class Child extends Base {
  static info() {
    super.info(); // Call parent static
    console.log("Child static");
  }
}

Child.info();
// Output:
// Base static
// Child static
```

### Rule 6: `super` Property Access

In methods, `super.property` accesses inherited properties:

```js
class Parent {
  get value() {
    return 42;
  }
}

class Child extends Parent {
  getValue() {
    return super.value; // Get parent's value
  }
}

const c = new Child();
console.log(c.getValue()); // 42
```

### Edge Case: Multiple Levels of Inheritance

`super` always refers to the **immediate parent**, not grandparent:

```js
class A {
  greet() { console.log("A"); }
}

class B extends A {
  greet() {
    super.greet();  // A's greet
    console.log("B");
  }
}

class C extends B {
  greet() {
    super.greet();  // B's greet (which calls A's)
    console.log("C");
  }
}

new C().greet();
// Output:
// A
// B
// C
```

---

## 7. Static Members (Methods & Properties)

Static members belong to the **class itself**, not instances. They're inherited by child classes.

### Static Methods

```js
class MathUtils {
  static add(a, b) {
    return a + b;
  }

  static PI = 3.14159;
}

console.log(MathUtils.add(2, 3));  // 5
console.log(MathUtils.PI);         // 3.14159

const utils = new MathUtils();
console.log(utils.add(2, 3)); // ❌ TypeError: utils.add is not a function
```

**Static methods do NOT exist on instances.**

### Static Properties (Fields)

(ES2022+) Define static data on the class:

```js
class User {
  static userCount = 0;

  constructor(name) {
    this.name = name;
    User.userCount++;
  }

  static getCount() {
    return User.userCount;
  }
}

console.log(User.userCount); // 0
new User("Alice");
new User("Bob");
console.log(User.getCount()); // 2
```

### Inheritance of Static Members

Static members are **automatically inherited** by child classes:

```js
class Base {
  static version = "1.0";
  static info() {
    console.log("Base");
  }
}

class Child extends Base {}

console.log(Child.version); // "1.0" (inherited)
Child.info(); // "Base"
```

### Overriding & Using `super` in Static Methods

```js
class Base {
  static info() {
    console.log("Base");
  }
}

class Child extends Base {
  static info() {
    super.info(); // Call parent's static
    console.log("Child");
  }
}

Child.info();
// Output:
// Base
// Child
```

### Pre-ES2022 Static Properties

Before ES2022, use assignment:

```js
class User {
  constructor(name) {
    this.name = name;
  }
}

User.maxUsers = 100;

console.log(User.maxUsers); // 100
```

---

## 8. Private Members (#)

Private members (ES2022+) are **not inherited** and **not accessible** outside the class. They're scoped to the class lexically.

### Private Fields

```js
class SecureBox {
  #password; // Private field

  constructor(pwd) {
    this.#password = pwd;
  }

  checkPassword(input) {
    return input === this.#password; // Can access from inside
  }
}

const box = new SecureBox("secret123");
console.log(box.checkPassword("secret123")); // true
console.log(box.#password); // ❌ SyntaxError: Private field '#password' must be declared
```

### Private Methods

```js
class Logger {
  #log(message) {
    console.log(`[LOG] ${message}`);
  }

  info(message) {
    this.#log(message); // Can call from inside
  }
}

const logger = new Logger();
logger.info("Hello"); // "[LOG] Hello"
logger.#log("Test"); // ❌ SyntaxError: Private field '#log' must be declared
```

### NOT Inherited

Private members are **not accessible** in child classes:

```js
class Parent {
  #secret = "hidden";

  revealSecret() {
    return this.#secret; // Can access from inside
  }
}

class Child extends Parent {
  tryAccess() {
    return this.#secret; // ❌ SyntaxError: Private field '#secret' must be declared
  }

  // But can call parent's method:
  getSecret() {
    return this.revealSecret(); // ✔ Works (via public method)
  }
}

const child = new Child();
console.log(child.revealSecret()); // "hidden"
console.log(child.getSecret());    // "hidden"
```

### Pre-ES2022 Privacy: WeakMap Pattern

Before `#` was available, use WeakMap closures:

```js
const _passwords = new WeakMap();

class SecureBox {
  constructor(password) {
    _passwords.set(this, password);
  }

  checkPassword(input) {
    return input === _passwords.get(this);
  }
}

const box = new SecureBox("secret");
console.log(box.checkPassword("secret")); // true
console.log(_passwords.get(box)); // "secret" (but not directly accessible from box)
```

**WeakMap advantages:**
- Garbage-collects automatically when object is deleted
- Prevents memory leaks
- True privacy (only accessible via the closure)

---

## 9. Protected-Like Pattern (Conventions)

JavaScript has **no true `protected` keyword** (like Java). By convention, use `_` prefix to indicate "protected" (accessible in child classes but not meant for public use):

```js
class Base {
  _protectedData = "base"; // Convention: protected

  _protectedMethod() {
    console.log("Protected method");
  }
}

class Child extends Base {
  useProtected() {
    console.log(this._protectedData); // ✔ Accessible in child
    this._protectedMethod();          // ✔ Accessible in child
  }
}

const c = new Child();
c.useProtected(); // Works
c._protectedData = "modified"; // Works, but shouldn't (convention)
```

**This is NOT enforcement**, just a social convention. Use if you need parent-child sharing without full privacy.

---

## 10. Extending Built-in Objects

Built-ins like `Array`, `Error`, `Map`, etc. can be subclassed, but some quirks apply.

### Extending Array

```js
class MyArray extends Array {
  first() {
    return this[0];
  }

  last() {
    return this[this.length - 1];
  }
}

const arr = new MyArray(1, 2, 3, 4, 5);
console.log(arr.first()); // 1
console.log(arr.last());  // 5
console.log(arr.length);  // 5
arr.push(6);
console.log(arr.length);  // 6
```

### Pitfall: Methods Return Wrong Type

Some built-in methods return instances of the base class, not your subclass:

```js
class MyArray extends Array {
  custom() {
    return "custom";
  }
}

const arr = new MyArray(1, 2, 3);
const sliced = arr.slice(0, 2); // Returns plain Array, not MyArray!

console.log(sliced instanceof MyArray); // false
console.log(sliced instanceof Array);   // true
console.log(sliced.custom); // undefined
```

**Fix 1: Override the method**

```js
class MyArray extends Array {
  slice(start, end) {
    const result = super.slice(start, end);
    return new MyArray(...result); // Wrap in MyArray
  }
}
```

**Fix 2: Use `Symbol.species`** (advanced)

```js
class MyArray extends Array {
  static get [Symbol.species]() {
    return MyArray; // Tell built-in methods to use MyArray
  }
}

const arr = new MyArray(1, 2, 3);
const sliced = arr.slice(0, 2);
console.log(sliced instanceof MyArray); // true
```

### Extending Error

```js
class CustomError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "CustomError";
  }
}

const err = new CustomError("Something failed", 500);
console.log(err.message); // "Something failed"
console.log(err.code);    // 500
console.log(err.name);    // "CustomError"
console.log(err instanceof Error); // true
```

### Extending Map

```js
class ObservableMap extends Map {
  set(key, value) {
    console.log(`Setting ${key} = ${value}`);
    return super.set(key, value); // Call parent's set
  }
}

const map = new ObservableMap();
map.set("x", 10); // "Setting x = 10"
console.log(map.get("x")); // 10
```

---

## 11. Mixins & Multiple Inheritance Simulation

JavaScript has **no native multiple inheritance**, but you can simulate it using mixins.

### Mixin Pattern with `Object.assign()`

Mixins are objects/classes with shared behavior that you "mix in" to another class:

```js
const canWalk = {
  walk() {
    console.log(`${this.name} is walking`);
  }
};

const canTalk = {
  talk() {
    console.log(`${this.name} is talking`);
  }
};

const canSing = {
  sing() {
    console.log(`${this.name} is singing`);
  }
};

class Person {
  constructor(name) {
    this.name = name;
  }
}

// Mix in all behaviors
Object.assign(Person.prototype, canWalk, canTalk, canSing);

const p = new Person("Alice");
p.walk();  // "Alice is walking"
p.talk();  // "Alice is talking"
p.sing();  // "Alice is singing"
```

### Mixin Pattern with Higher-Order Functions

For cleaner composition with classes:

```js
const withWalk = (Base) => class extends Base {
  walk() {
    console.log(`${this.name} is walking`);
  }
};

const withTalk = (Base) => class extends Base {
  talk() {
    console.log(`${this.name} is talking`);
  }
};

class Person {
  constructor(name) {
    this.name = name;
  }
}

// Compose mixins (right to left)
class SuperPerson extends withWalk(withTalk(Person)) {}

const p = new SuperPerson("Bob");
p.walk(); // "Bob is walking"
p.talk(); // "Bob is talking"
```

### Ordering Matters (Method Resolution Order)

When mixins have overlapping methods, **the first mixin wins:**

```js
const greetA = {
  greet() { return "Hello from A"; }
};

const greetB = {
  greet() { return "Hello from B"; }
};

class Person {}

Object.assign(Person.prototype, greetA, greetB); // greetA is added first

const p = new Person();
console.log(p.greet()); // "Hello from A" (greetA wins)
```

---

## 12. Composition vs Inheritance

**Composition** (has-a) is often better than **inheritance** (is-a) because it's more flexible.

### Inheritance Approach (Fragile)

```js
class Animal {
  eat() { console.log("Eating"); }
}

class Car extends Animal {
  // ❌ Car is NOT an Animal, this is wrong!
}
```

This is semantically wrong and creates tight coupling.

### Composition Approach (Flexible)

```js
// Separate concerns into composable parts
class Engine {
  start() {
    console.log("Engine starting");
  }
}

class Wheels {
  roll() {
    console.log("Wheels rolling");
  }
}

class Car {
  constructor() {
    this.engine = new Engine();
    this.wheels = new Wheels();
  }

  drive() {
    this.engine.start();
    this.wheels.roll();
  }
}

const car = new Car();
car.drive();
// Output:
// Engine starting
// Wheels rolling
```

**Advantages of composition:**
- No fake inheritance hierarchies
- Flexible swapping of implementations
- Easier testing (inject different components)
- Avoids deep inheritance chains

### When to Use Inheritance

Use inheritance when there's a true "is-a" relationship:

```js
// ✔ Correct: A Dog IS-A Animal
class Animal {
  eat() { console.log("Eating"); }
}

class Dog extends Animal {
  bark() { console.log("Woof"); }
}
```

---

## 13. Edge Cases & Pitfalls

### Pitfall 1: Shared Mutable State in Prototypes

**CRITICAL:** Mutable objects/arrays in prototypes are **shared across all instances:**

```js
function Person(name) {
  this.name = name;
}

Person.prototype.hobbies = []; // ❌ Shared!

const p1 = new Person("Alice");
const p2 = new Person("Bob");

p1.hobbies.push("coding");
console.log(p2.hobbies); // ["coding"] (SHARED!)
```

**Fix: Initialize in constructor**

```js
function Person(name) {
  this.name = name;
  this.hobbies = []; // ✔ Own property for each instance
}
```

### Pitfall 2: Forgetting `new` with Constructor Function

Without `new`, `this` is not bound correctly:

```js
function Person(name) {
  this.name = name;
}

const p = Person("Alice"); // ❌ Forgot 'new'
console.log(p); // undefined
console.log(window.name); // "Alice" (set on global object!)
```

**Fix: Always use `new` or classes (which require `new`)**

Classes throw an error if not called with `new`:

```js
class Person {
  constructor(name) {
    this.name = name;
  }
}

const p = Person("Alice"); // ❌ TypeError: Class constructor cannot be invoked without 'new'
```

### Pitfall 3: `this` Context in Callbacks

When passing methods as callbacks, `this` binding is lost:

```js
class User {
  constructor(name) {
    this.name = name;
  }

  greet() {
    console.log(`Hello, ${this.name}`);
  }
}

const u = new User("Alice");
u.greet(); // "Hello, Alice"

const cb = u.greet;
cb(); // ❌ "Hello, undefined" (this = global/undefined)
```

**Fix 1: Arrow function in class field**

```js
class User {
  constructor(name) {
    this.name = name;
  }

  greet = () => {
    console.log(`Hello, ${this.name}`); // Arrow captures this
  }
}

const u = new User("Alice");
const cb = u.greet;
cb(); // ✔ "Hello, Alice"
```

---

## 14. Property Lookup, Shadowing & Deletion

### Property Ownership: Own vs Inherited

Use `hasOwnProperty()` or `Object.hasOwn()` to check **own properties only:**

```js
const parent = { x: 1 };
const child = Object.create(parent);

console.log("x" in child); // true (own or inherited)
console.log(child.hasOwnProperty("x")); // false (inherited)
console.log(Object.hasOwn(child, "x")); // false (ES2022+)
```

### Shadowing

When you set a property on a child, it **shadows** the parent's property:

```js
const parent = { value: 10 };
const child = Object.create(parent);

console.log(child.value); // 10 (from parent)
child.value = 20; // Creates own property
console.log(child.value); // 20 (own property)

delete child.value; // Delete own property
console.log(child.value); // 10 (reveals parent's again)
```

### Deletion

You **cannot delete** inherited properties:

```js
const parent = { x: 1 };
const child = Object.create(parent);

delete child.x; // Tries to delete (but x is inherited, not own)
console.log(child.x); // 1 (still there)
console.log(parent.x); // 1 (parent unaffected)
```

---

## 15. Getters & Setters in Inheritance

Prototypes can define getters/setters that child instances use:

```js
const parent = {
  _value: 0,

  get value() {
    return this._value;
  },

  set value(v) {
    this._value = v;
  }
};

const child = Object.create(parent);
child.value = 10; // Invokes setter
console.log(child.value); // 10 (invokes getter)
```

---

## 16. Symbols in Inheritance

Symbols are unique identifiers that can be used as property keys. They're inherited like regular properties:

```js
const sym = Symbol("unique");

const parent = {
  [sym]: "parent's value"
};

const child = Object.create(parent);
console.log(child[sym]); // "parent's value" (inherited)
```

---

## 17. WeakMaps for Privacy Pre-ES2022

Before `#` private fields, WeakMap was the pattern for strong privacy:

```js
const _privateData = new WeakMap();

class Base {
  constructor(secret) {
    _privateData.set(this, { secret });
  }

  getSecret() {
    return _privateData.get(this).secret;
  }
}

const b = new Base("hidden");
console.log(b.getSecret()); // "hidden"
```

**Why WeakMap?**
- Garbage collects automatically
- Data not enumerable
- True privacy (requires access to WeakMap variable)

---

## 18. Performance Considerations

### Prototype Chain Depth

**Deep chains slow lookups:**

```js
// ❌ 10-level chain (slow)
let obj = Object.create(null);
for (let i = 0; i < 10; i++) {
  obj = Object.create(obj); // Deep chain
}

// ✔ Shallow chain (fast)
const obj2 = Object.create(Object.create(null)); // Max 2 levels
```

Keep chains **2-3 levels max** for optimal performance.

### Method Placement

**Methods on prototype (efficient):**

```js
class User {
  constructor(name) {
    this.name = name; // Instance property
  }
  greet() { // Shared across instances
    return `Hello, ${this.name}`;
  }
}

// 1000 instances = 1 greet function
```

**All methods on instance (inefficient):**

```js
class User {
  constructor(name) {
    this.name = name;
    this.greet = function() { // Copy per instance
      return `Hello, ${this.name}`;
    };
  }
}

// 1000 instances = 1000 greet functions (~24KB)
```

### Changing Prototypes Deoptimizes

```js
// ❌ Slow (deoptimizes)
const obj = {};
Object.setPrototypeOf(obj, Parent.prototype);

// ✔ Fast (optimized)
const obj = Object.create(Parent.prototype);
```

---

## 19. Debugging & Introspection

### Checking Instance Relationships

```js
class Animal {}
class Dog extends Animal {}

const dog = new Dog();

console.log(dog instanceof Dog);      // true
console.log(dog instanceof Animal);   // true
console.log(dog instanceof Object);   // true
```

### Checking Direct Prototype

```js
class Parent {}
class Child extends Parent {}
const c = new Child();

console.log(Object.getPrototypeOf(c) === Child.prototype); // true
```

### Inspecting Prototype Chain

```js
function printChain(obj) {
  let proto = Object.getPrototypeOf(obj);
  while (proto) {
    console.log(proto);
    proto = Object.getPrototypeOf(proto);
  }
}

class Base {}
class Child extends Base {}
const c = new Child();

printChain(c);
// Logs: Child.prototype, Base.prototype, Object.prototype, null
```

---

## 20. Common Mistakes & Best Practices

### Mistakes to Avoid

1. **Mutable shared state in prototypes**
2. **Forgetting `super()` in derived constructors**
3. **Using `__proto__` in production**
4. **Deep inheritance chains (fragile)**
5. **Forgetting to fix `.constructor`**

### Best Practices

1. **Use classes** for modern, readable code; understand prototypes underneath
2. **Initialize mutables in constructors**, not prototypes
3. **Keep chains shallow** (2-3 levels max)
4. **Use privates (#)** for true encapsulation
5. **Prefer composition** over inheritance for flexibility
6. **Test with `instanceof` and `Object.getPrototypeOf()`**

---

## 21. Historical Context & Evolution

### Why Prototypes?

Brendan Eich (JavaScript's creator) drew inspiration from **Self**, a Smalltalk variant using prototype-based inheritance. Prototypes are elegant—objects inherit directly from other objects.

### Why Classes?

In 2015, ES6 added `class` syntax because:
1. **Familiarity:** Developers from Java/C++ understand classes
2. **Readability:** `class Child extends Parent` is clearer
3. **Safety:** Classes prevent common mistakes
4. **Tooling:** Easier for transpilers and type checkers

**Classes are syntactic sugar**, not a new model.

### Evolution Timeline

| Version | Feature |
|---------|---------|
| ES1-3 | Constructor functions, prototypes |
| ES5 | `Object.create()`, `Object.defineProperty()` |
| ES6 | Classes, `super`, `extends` |
| ES2022 | Private fields (`#`), static fields |

---

## Final Summary

**JavaScript has ONLY prototype-based inheritance.**

- Every object has a `[[Prototype]]` slot (accessed via `Object.getPrototypeOf()`)
- Prototypes form a chain for property lookup
- Classes are syntactic sugar over constructor functions + prototypes
- `super()` enables child-to-parent calls (ES6+ only)
- Privates (`#`) provide true encapsulation (ES2022+)
- Statics belong to the class, not instances
- Composition is often preferable to inheritance
- Keep chains shallow (2-3 levels) for performance
- **Understand the chain to avoid surprises.**

This guide covers 99%+ of real-world inheritance scenarios. For deeper dives, explore the ECMAScript specification or use `console.dir()` to inspect objects.
