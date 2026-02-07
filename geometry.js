// geometry.js

// Constant
export const PI = 3.14159265359;

// Area of Circle
export function areaOfCircle(radius) {
    return PI * radius * radius;
}

// Area of Rectangle
export function areaOfRectangle(length, width) {
    return length * width;
}

// Surface Area of Cylinder
export function areaOfCylinder(radius, height) {
    return 2 * PI * radius * (radius + height);
}
