// q5.js
// Import a module containing the constants and method for calculating area of circle, rectangle, cylinder.


import {
    PI,
    areaOfCircle,
    areaOfRectangle,
    areaOfCylinder
} from "./geometry.js";

console.log("PI =", PI);

console.log("Circle Area:", areaOfCircle(5));
console.log("Rectangle Area:", areaOfRectangle(4, 6));
console.log("Cylinder Area:", areaOfCylinder(3, 7));
