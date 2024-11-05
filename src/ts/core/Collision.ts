import { equivalent } from "./Common";
import { Polygon } from "./Polygon";
import { Vec2 } from "./Vec2";


export interface Ray {
    origin: Vec2;
    direction: Vec2;
}

export interface LineSegment {
    a: Vec2,
    b: Vec2
}

export interface Intersection {
    position: Vec2,
    t: number,
}

// https://ncase.me/sight-and-light/
export function intersectRayLine(r: Ray, s: LineSegment): Intersection | null {

    const sDirection = s.b.copy().sub(s.a).normalize();
    // check if ray and segment are parallel
    if (equivalent(sDirection.cross(r.direction), 0.0)) {
        return null
    }


    const r_px = r.origin.x;
    const r_py = r.origin.y;
    const r_dx = r.direction.x;
    const r_dy = r.direction.y;

    const s_px = s.a.x;
    const s_py = s.a.y;
    const s_dx = (s.b.x - s.a.x);
    const s_dy = (s.b.y - s.a.y);

    const epsilon = 0.0001;

    const T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx);
    if (T2 < (0.0 - epsilon) || T2 > (1.0 + epsilon)) return null

    if (equivalent(r_dx, 0.0)) {
        const t1 = (s_py+s_dy*T2-r_py)/r_dy;
        if (t1 < 0.0) return null;
    } else {
        const t1 = (s_px+s_dx*T2-r_px)/r_dx;
        if (t1 < 0.0) return null;
    }

    const p = new Vec2(s.a.x + s_dx * T2, s.a.y + s_dy * T2)
    return { position: p, t: T2 };
}


export function intersectRayPoly(r: Ray, polygon: Polygon): Vec2[] {
    if (polygon.points.length < 2) 
        return [];

    const results: Vec2[] = [];    

    for (let i = 0; i < polygon.points.length; i++) {
        const a = polygon.points[i];
        const b = polygon.points[(i + 1) % polygon.points.length];

        const intersection = intersectRayLine(r, {a, b});
        if (intersection) 
            results.push(intersection.position); 
    }

    return results;
}


// Finds the orientation of point 'c' relative to the line segment (a, b)
// Returns  0 if all three points are collinear.
// Returns -1 if 'c' is clockwise to segment (a, b), i.e right of line formed by the segment.
// Returns +1 if 'c' is counter clockwise to segment (a, b), i.e left of line
// formed by the segment.
function orientation(a: Vec2, b: Vec2, c: Vec2): number {
    const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)

    if (equivalent(Math.abs(value), 0.0))
        return 0;

    return value > 0 ? -1 : 1;
}


export function insideConvexPolygon(p: Vec2, polygon: Polygon): boolean {

    for (let i = 0; i < polygon.points.length; i++) {
        const a = polygon.points[i];
        const b = polygon.points[(i + 1) % polygon.points.length];

        const result = orientation(a, b, p);
        if (result == -1) 
            return false
    }

    return true;
}