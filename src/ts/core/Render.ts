import { Context } from "../Context";
import { Color } from "./Color";
import { Rect } from "./Rect";
import { Vec2 } from "./Vec2";


export function debugPoint(context: Context, point: Vec2, color: Color) {
    const ctx = context.ctx;

    ctx.fillStyle = color.toHex();

    ctx.beginPath();
    ctx.arc(point.x, point.y, context.baseFontSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
}

export function debugPoints(context: Context, points: Vec2[], color: Color) {
    for (const c of points) 
        debugPoint(context, c, color);
}

export function debugRect(context: Context, rect: Rect, color: Color) {
    const ctx = context.ctx;
    ctx.fillStyle = color.toHex();

    ctx.beginPath();
    ctx.rect(rect.left, rect.top, rect.width(), rect.height());
    ctx.fill();
}
