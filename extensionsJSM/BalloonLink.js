/*
 *  Copyright 1998-2025 by Northwoods Software Corporation. All Rights Reserved.
 */
/*
 * This is an extension and not part of the main GoJS library.
 * The source code for this is at extensionsJSM/BalloonLink.ts.
 * Note that the API for this class may change with any version, even point releases.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
 * See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
 */
import * as go from 'gojs';
/**
 * This custom {@link go.Link} class customizes its {@link go.Shape} to surround the comment node (the from node).
 * If the Shape is filled, it will obscure the comment itself unless the Link is behind the comment node.
 * Thus the default layer for BalloonLinks is "Background".
 *
 * The "corner" property controls the radius of the curves at the corners of the rectangular area surrounding the comment node,
 * rather than the curve at corners along the route, which is always straight.
 * The default value is 10.
 *
 * If you want to experiment with this extension, try the <a href="../../samples/BalloonLink.html">Balloon Links</a> sample.
 * @category Part Extension
 */
export class BalloonLink extends go.Link {
    /**
     * Constructs a BalloonLink and sets the {@link go.Part.layerName} property to "Background".
     */
    constructor(init) {
        super();
        this._base = 15;
        this.layerName = 'Background';
        this.corner = 10;
        this.defaultToPoint = new go.Point(0, 0);
        if (init)
            Object.assign(this, init);
    }
    /**
     * Copies properties to a cloned BalloonLink.
     */
    cloneProtected(copy) {
        super.cloneProtected(copy);
        copy._base = this._base;
    }
    /**
     * Gets or sets width of the base of the triangle at the center point of the {@link go.Link.fromNode}.
     *
     * The default value is 15.
     */
    get base() {
        return this._base;
    }
    set base(value) {
        const old = this._base;
        if (old !== value) {
            if (typeof value !== 'number')
                throw new Error('BalloonLink.base must be a number');
            this._base = value;
            this.raiseChangedEvent(go.ChangeType.Property, 'base', this, old, value);
        }
    }
    /**
     * Produce a Geometry from the Link's route that draws a "balloon" shape around the {@link go.Link.fromNode}
     * and has a triangular shape with the base at the fromNode and the top at the toNode.
     */
    makeGeometry() {
        if (this.fromNode === null)
            return new go.Geometry();
        // assume the fromNode is the comment and the toNode is the commented-upon node
        const bb = this.fromNode.actualBounds.copy().addMargin(this.fromNode.margin);
        let pn = this.pointsCount === 0 ? bb.center : this.getPoint(this.pointsCount - 1);
        if (this.toNode !== null && bb.intersectsRect(this.toNode.actualBounds)) {
            pn = this.toNode.actualBounds.center;
        }
        else if (this.toNode === null && this.pointsCount === 0) {
            pn = new go.Point(bb.centerX, bb.bottom + 50);
        }
        const base = Math.max(0, this.base);
        const corner = Math.min(Math.max(0, this.corner), Math.min(bb.width / 2, bb.height / 2));
        const cornerext = Math.min(base, corner + base / 2);
        const fig = new go.PathFigure();
        let prevx = 0;
        let prevy = 0;
        // helper functions
        function start(x, y) {
            fig.startX = prevx = x;
            fig.startY = prevy = y;
        }
        function point(x, y, v, w) {
            fig.add(new go.PathSegment(go.SegmentType.Line, x, y));
            fig.add(new go.PathSegment(go.SegmentType.Line, v, w));
            prevx = v;
            prevy = w;
        }
        function turn(x, y) {
            if (prevx === x && prevy > y) {
                // top left
                fig.add(new go.PathSegment(go.SegmentType.Line, x, y + corner));
                fig.add(new go.PathSegment(go.SegmentType.Arc, 180, 90, x + corner, y + corner, corner, corner));
            }
            else if (prevx < x && prevy === y) {
                // top right
                fig.add(new go.PathSegment(go.SegmentType.Line, x - corner, y));
                fig.add(new go.PathSegment(go.SegmentType.Arc, 270, 90, x - corner, y + corner, corner, corner));
            }
            else if (prevx === x && prevy < y) {
                // bottom right
                fig.add(new go.PathSegment(go.SegmentType.Line, x, y - corner));
                fig.add(new go.PathSegment(go.SegmentType.Arc, 0, 90, x - corner, y - corner, corner, corner));
            }
            else if (prevx > x && prevy === y) {
                // bottom left
                fig.add(new go.PathSegment(go.SegmentType.Line, x + corner, y));
                fig.add(new go.PathSegment(go.SegmentType.Arc, 90, 90, x + corner, y - corner, corner, corner));
            } // else if prevx === x && prevy === y, no-op
            prevx = x;
            prevy = y;
        }
        if (pn.x < bb.left) {
            if (pn.y < bb.top) {
                start(bb.left, Math.min(bb.top + cornerext, bb.bottom - corner));
                point(pn.x, pn.y, Math.min(bb.left + cornerext, bb.right - corner), bb.top);
                turn(bb.right, bb.top);
                turn(bb.right, bb.bottom);
                turn(bb.left, bb.bottom);
            }
            else if (pn.y > bb.bottom) {
                start(Math.min(bb.left + cornerext, bb.right - corner), bb.bottom);
                point(pn.x, pn.y, bb.left, Math.max(bb.bottom - cornerext, bb.top + corner));
                turn(bb.left, bb.top);
                turn(bb.right, bb.top);
                turn(bb.right, bb.bottom);
            }
            else {
                // pn.y >= bb.top && pn.y <= bb.bottom
                const y = Math.min(Math.max(pn.y + base / 3, bb.top + corner + base), bb.bottom - corner);
                start(bb.left, y);
                point(pn.x, pn.y, bb.left, Math.max(y - base, bb.top + corner));
                turn(bb.left, bb.top);
                turn(bb.right, bb.top);
                turn(bb.right, bb.bottom);
                turn(bb.left, bb.bottom);
            }
        }
        else if (pn.x > bb.right) {
            if (pn.y < bb.top) {
                start(Math.max(bb.right - cornerext, bb.left + corner), bb.top);
                point(pn.x, pn.y, bb.right, Math.min(bb.top + cornerext, bb.bottom - corner));
                turn(bb.right, bb.bottom);
                turn(bb.left, bb.bottom);
                turn(bb.left, bb.top);
            }
            else if (pn.y > bb.bottom) {
                start(bb.right, Math.max(bb.bottom - cornerext, bb.top + corner));
                point(pn.x, pn.y, Math.max(bb.right - cornerext, bb.left + corner), bb.bottom);
                turn(bb.left, bb.bottom);
                turn(bb.left, bb.top);
                turn(bb.right, bb.top);
            }
            else {
                // pn.y >= bb.top && pn.y <= bb.bottom
                const y = Math.min(Math.max(pn.y + base / 3, bb.top + corner + base), bb.bottom - corner);
                start(bb.right, Math.max(y - base, bb.top + corner));
                point(pn.x, pn.y, bb.right, y);
                turn(bb.right, bb.bottom);
                turn(bb.left, bb.bottom);
                turn(bb.left, bb.top);
                turn(bb.right, bb.top);
            }
        }
        else {
            // pn.x >= bb.left && pn.x <= bb.right
            const x = Math.min(Math.max(pn.x + base / 3, bb.left + corner + base), bb.right - corner);
            if (pn.y < bb.top) {
                start(Math.max(x - base, bb.left + corner), bb.top);
                point(pn.x, pn.y, x, bb.top);
                turn(bb.right, bb.top);
                turn(bb.right, bb.bottom);
                turn(bb.left, bb.bottom);
                turn(bb.left, bb.top);
            }
            else if (pn.y > bb.bottom) {
                start(x, bb.bottom);
                point(pn.x, pn.y, Math.max(x - base, bb.left + corner), bb.bottom);
                turn(bb.left, bb.bottom);
                turn(bb.left, bb.top);
                turn(bb.right, bb.top);
                turn(bb.right, bb.bottom);
            }
            else {
                // inside
                start(bb.left, bb.top + bb.height / 2);
                // no "point", just corners
                turn(bb.left, bb.top);
                turn(bb.right, bb.top);
                turn(bb.right, bb.bottom);
                turn(bb.left, bb.bottom);
            }
        }
        const geo = new go.Geometry();
        fig.segments.last().close();
        geo.add(fig);
        geo.offset(-this.routeBounds.x, -this.routeBounds.y);
        return geo;
    }
}
