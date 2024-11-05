import { Color } from "./Color";
import { Rect } from "./Rect";
import { Vec2 } from "./Vec2";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function equivalent(a: number, b:number, eps: number = 0.000001): boolean {
  return Math.abs(b - a) < eps;
}

export function degresToRadians(degrees: number): number {
  return degrees * Math.PI / 180;
}

export function radiansToDegrees(radians: number): number {
  return radians * 180 / Math.PI;
}

export function lerp(a: number, b: number, t: number): number {
  return a * (1.0 - t) + b * t;
}

export function easeInCubic(x: number): number {
  return x * x * x;
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInQuint(x: number): number {
  return x * x * x * x * x;
}

export function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

export function coinFlip(): boolean {
  return randomly(0.5);
}

export function randomly(probability: number): boolean {
  return Math.random() <= probability;
}

export function randomRangeValue(start: number, end: number): number {
  return start + (end - start) * Math.random();
}

export function randomElement<type>(array: Array<type>): type {
  return array[Math.floor(Math.random() * array.length)];
}

export function angleBetween(v: Vec2, w: Vec2): number {
  const y = w.y * v.x - w.x * v.y;
  const x = w.x * v.x + w.y * v.y;

  if (equivalent(x, 0.0))
    return 0.0;

  return Math.atan2(y, x);
}

export function directionAngle(dir: Vec2): number {
  const angle = Math.atan2(dir.y, dir.x);
  return angle;
}

export function angleToVec(angle: number): Vec2 {
  return new Vec2(Math.cos(angle), Math.sin(angle));
}

export function rotate2d(v: Vec2, angle: number): Vec2 {
  const x = v.x * Math.cos(angle) - v.y * Math.sin(angle);
  const y = v.x * Math.sin(angle) + v.y * Math.cos(angle);
  return new Vec2(x, y);
}

export function boundingBox(points: Array<Vec2>): Rect {
  if (points.length === 0)
    return Rect.zero();

  let min = new Vec2(Number.MAX_VALUE, Number.MAX_VALUE);
  let max = new Vec2(-Number.MAX_VALUE, -Number.MAX_VALUE);

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
  }

  return new Rect(min.x, min.y, max.x, max.y);
}

export function repeatSpace(halfRange: number, value: number): number {
  let rangeStart = -halfRange
  let rangeTotal = halfRange - rangeStart
  let offset = (value - rangeStart) / rangeTotal

  var repeatedOffset = offset % 1.0
  if (repeatedOffset < 0.0)
      repeatedOffset += 1.0

  return -halfRange + repeatedOffset * rangeTotal
}


export function computeLetterbox(dst: Vec2, src: Vec2): Rect {
    // Compute source/destination ratios.
    const srcWidth  = src.x;
    const srcHeight = src.y;

    const dstWidth  = dst.x;
    const dstHeight = dst.y;

    let width = 0;
    let height = 0;

    if (((srcWidth / srcHeight) * dstHeight) <= dstWidth) {
        // Column letterboxing ("pillar box")
        width  = dstHeight * (srcWidth / srcHeight);
        height = dstHeight;
    } else {
       // Row letterboxing.
       width  = dstWidth;
       height = dstWidth * (srcHeight / srcWidth);
    }

    const left = (dstWidth - width) * 0.5;
    const top = (dstHeight - height) * 0.5;
    
    return new Rect(left, top, left + width, top + height);
}



export const palette = [
  Color.iRGB(155, 41, 72),
  Color.iRGB(255, 114, 81),
  Color.iRGB(255, 205, 116),
  Color.iRGB(255, 237, 191),

  Color.iRGB(68, 76, 92),
  Color.iRGB(206, 90, 87),
  Color.iRGB(120, 165, 163),
  Color.iRGB(225, 177, 106),
  Color.iRGB(170, 170, 170)
];