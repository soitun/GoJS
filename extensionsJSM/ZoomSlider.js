/*
 *  Copyright 1998-2025 by Northwoods Software Corporation. All Rights Reserved.
 */
/*
 * This is an extension and not part of the main GoJS library.
 * The source code for this is at extensionsJSM/ZoomSlider.ts.
 * Note that the API for this class may change with any version, even point releases.
 * If you intend to use an extension in production, you should copy the code to your own source directory.
 * Extensions can be found in the GoJS kit under the extensions or extensionsJSM folders.
 * See the Extensions intro page (https://gojs.net/latest/intro/extensions.html) for more information.
 */
import * as go from 'gojs';
/**
 * This class implements a zoom slider for GoJS diagrams.
 * The constructor takes two arguments:
 *   - `diagram` ***Diagram*** a reference to a GoJS Diagram
 *   - `options` ***Object*** an optional JS Object describing options for the slider
 *
 * Options:
 *   - `alignment` ***Spot*** see {@link alignment}
 *   - `alignmentFocus` ***Spot*** see {@link alignmentFocus}
 *   - `size` ***number*** see {@link size}
 *   - `buttonSize` ***number*** see {@link buttonSize}
 *   - `orientation` ***string*** see {@link orientation}
 *   - `opacity` ***number*** see {@link opacity}
 *
 * Example usage of ZoomSlider:
 * ```js
 * const zoomSlider = new ZoomSlider(myDiagram,
 *   {
 *     alignment: go.Spot.TopRight, alignmentFocus: go.Spot.TopRight,
 *     size: 150, buttonSize: 30, orientation: 'horizontal'
 *   });
 * ```
 *
 * This is the basic HTML Structure that the ZoomSlider creates as a sibling div of the diagram:
 * ```html
 * <div class="zoomSlider">
 *   <button id="zoomSliderOut" class="zoomButton">-</button>
 *   <div id="zoomSliderRangeCtn" class="zoomRangeContainer">
 *     <input id="zoomSliderRange" class="zoomRangeInput" type="range" min="-50" max="100">
 *   </div>
 *   <button id="zoomSliderIn" class="zoomButton">+</button>
 * </div>
 * ```
 *
 * <p class="box">
 * The diagram div's parent element should use `position: relative` to ensure the slider gets positioned properly.
 *
 * If you want to experiment with this extension, try the <a href="../../samples/ZoomSlider.html">Zoom Slider</a> sample.
 * @category Extension
 */
export class ZoomSlider {
    /**
     * Constructs a ZoomSlider and sets up properties based on the options provided.
     * Also sets up change listeners on the Diagram so the ZoomSlider stays up-to-date.
     * @param diagram - a reference to a GoJS Diagram
     * @param options - an optional JS Object describing options for the slider
     */
    constructor(diagram, options) {
        // Slider options defaults:
        this._size = 125;
        this._buttonSize = 25;
        this._alignment = go.Spot.BottomRight;
        this._alignmentFocus = go.Spot.BottomRight;
        this._orientation = 'vertical';
        this._opacity = 0.75;
        this._diagram = diagram;
        this._initialScale = diagram.scale;
        this._diagramDiv = diagram.div;
        this._sliderDiv = null;
        this._zoomSliderOut = null;
        this._zoomSliderIn = null;
        this._zoomSliderRange = null;
        this._zoomSliderRangeCtn = null;
        // Set properties based on options
        if (options) {
            if (options.size !== undefined)
                this._size = options.size;
            if (options.buttonSize !== undefined)
                this._buttonSize = options.buttonSize;
            if (options.alignment !== undefined)
                this._alignment = options.alignment;
            if (options.alignmentFocus !== undefined)
                this._alignmentFocus = options.alignmentFocus;
            if (options.orientation !== undefined)
                this._orientation = options.orientation;
            if (options.opacity !== undefined)
                this._opacity = options.opacity;
        }
        // Prepare change listeners
        const self = this;
        this.updateOnViewportBoundsChanged = (e) => {
            self.scaleToValue();
        };
        this.init();
    }
    /**
     * This read-only property returns the diagram for which the slider is handling zoom.
     */
    get diagram() {
        return this._diagram;
    }
    /**
     * Gets or sets the overall length, in pixels, that the slider will occupy.
     * The default value is 125.
     */
    get size() {
        return this._size;
    }
    set size(val) {
        const old = this._size;
        if (old !== val) {
            if (typeof val !== 'number')
                throw new Error('new value for ZoomSlider.size must be a number, not: ' + val);
            this._size = val;
            this.resize();
        }
    }
    /**
     * Gets or sets the height/width of the buttons at each end of the slider.
     * The default value is 25.
     */
    get buttonSize() {
        return this._buttonSize;
    }
    set buttonSize(val) {
        const old = this._buttonSize;
        if (old !== val) {
            if (typeof val !== 'number')
                throw new Error('new value for ZoomSlider.buttonSize must be a number, not: ' + val);
            this._buttonSize = val;
            this.resize();
        }
    }
    /**
     * Gets or sets the alignment Spot of this slider to determine where it should be placed relative to the diagram.
     * The default value is Spot.BottomRight.
     */
    get alignment() {
        return this._alignment;
    }
    set alignment(val) {
        const old = this._alignment;
        if (!old.equals(val)) {
            if (!(val instanceof go.Spot))
                throw new Error('new value for ZoomSlider.alignment must be a Spot, not: ' + val);
            this._alignment = val;
            this.realign();
        }
    }
    /**
     * Gets or sets the Spot on this slider to be used as the alignment point when placing it relative to the diagram.
     * The default value is Spot.BottomRight.
     */
    get alignmentFocus() {
        return this._alignmentFocus;
    }
    set alignmentFocus(val) {
        const old = this._alignmentFocus;
        if (!old.equals(val)) {
            if (!(val instanceof go.Spot))
                throw new Error('new value for ZoomSlider.alignmentFocus must be a Spot, not: ' + val);
            this._alignment = val;
            this._alignmentFocus = val;
            this.realign();
        }
    }
    /**
     * Gets or sets whether the slider is oriented vertically or horizontally.
     * Must be either "horizontal" or "vertical" and is case-sensitive.
     * The default value is `"vertical"`.
     */
    get orientation() {
        return this._orientation;
    }
    set orientation(val) {
        if (val !== 'horizontal' && val !== 'vertical') {
            throw new Error('Orientation must be "horizontal" or "vertical"');
        }
        const old = this._orientation;
        if (old !== val) {
            this._orientation = val;
            this.resize(true);
        }
    }
    /**
     * Gets or sets the opacity of the slider.
     * The default value is 0.75.
     */
    get opacity() {
        return this._opacity;
    }
    set opacity(val) {
        const old = this._opacity;
        if (old !== val) {
            if (typeof val !== 'number' || val < 0 || val > 1)
                throw new Error('new value for ZoomSlider.opacity must be a number between 0 and 1 inclusive, not: ' + val);
            this._opacity = val;
            if (this._sliderDiv !== null) {
                this._sliderDiv.style.opacity = val.toString();
            }
        }
    }
    /**
     * Initialize the slider.
     */
    init() {
        // Sets up the slider div and inner div's basic attributes and ids
        this.sliderDivSetup();
        this.resize(true);
        // Set up the runtime code
        this.sliderListenerSetup();
    }
    /**
     * Create the necessary divs for the slider and add the slider as a sibling of the diagram.
     */
    sliderDivSetup() {
        this._sliderDiv = document.createElement('div');
        this._sliderDiv.className = 'zoomSlider';
        // Initialize buttons and range input
        const zoomOutBtn = document.createElement('button');
        this._zoomSliderOut = zoomOutBtn;
        zoomOutBtn.className = 'zoomButton';
        zoomOutBtn.innerHTML = '-';
        zoomOutBtn.type = 'button';
        this._sliderDiv.appendChild(zoomOutBtn);
        const zoomRangeContainer = document.createElement('div');
        this._zoomSliderRangeCtn = zoomRangeContainer;
        zoomRangeContainer.className = 'zoomRangeContainer';
        this._sliderDiv.appendChild(zoomRangeContainer);
        const zoomRangeInput = document.createElement('input');
        this._zoomSliderRange = zoomRangeInput;
        zoomRangeInput.className = 'zoomRangeInput';
        zoomRangeInput.type = 'range';
        zoomRangeInput.min = '-50';
        zoomRangeInput.max = '100';
        zoomRangeContainer.appendChild(zoomRangeInput);
        const zoomInBtn = document.createElement('button');
        this._zoomSliderIn = zoomInBtn;
        zoomInBtn.className = 'zoomButton';
        zoomInBtn.innerHTML = '+';
        zoomInBtn.type = 'button';
        this._sliderDiv.appendChild(zoomInBtn);
        // Adds the slider as a sibling of the diagram
        // IMPORTANT: the diagram div's parent element should use position: relative
        if (this._diagramDiv !== null) {
            const diagramParent = this._diagramDiv.parentElement;
            if (diagramParent !== null) {
                diagramParent.appendChild(this._sliderDiv);
            }
        }
    }
    /**
     * Add listeners to the buttons and range input.
     * Add a diagram listener.
     */
    sliderListenerSetup() {
        const zoomOutBtn = this._zoomSliderOut;
        const zoomInBtn = this._zoomSliderIn;
        const zoomRangeInput = this._zoomSliderRange;
        if (zoomOutBtn === null || zoomInBtn === null || zoomRangeInput === null)
            return;
        // Set up diagram listener so the slider can be kept in sync with the diagram's scale
        this.diagram.addDiagramListener('ViewportBoundsChanged', this.updateOnViewportBoundsChanged);
        // Set up event handlers for buttons and input range slider
        const self = this;
        zoomOutBtn.onclick = () => {
            zoomRangeInput.stepDown();
            self.valueToScale();
        };
        zoomInBtn.onclick = () => {
            zoomRangeInput.stepUp();
            self.valueToScale();
        };
        const valChanged = () => {
            self.valueToScale();
        };
        zoomRangeInput.oninput = valChanged;
        zoomRangeInput.onchange = valChanged;
    }
    /**
     * Resize the slider.
     * @param reorient - whether or not to reorient the slider/buttons
     */
    resize(reorient) {
        let sliderWidth = 0;
        let sliderHeight = 0;
        const zoomOutBtn = this._zoomSliderOut;
        const zoomInBtn = this._zoomSliderIn;
        const zoomRangeContainer = this._zoomSliderRangeCtn;
        const zoomRangeInput = this._zoomSliderRange;
        if (this._sliderDiv === null ||
            zoomOutBtn === null ||
            zoomInBtn === null ||
            zoomRangeContainer === null ||
            zoomRangeInput === null)
            return;
        if (this.orientation === 'horizontal') {
            sliderWidth = this.size;
            sliderHeight = this.buttonSize;
            const rangeWidth = sliderWidth - sliderHeight * 2;
            zoomOutBtn.style.width = sliderHeight + 'px';
            zoomOutBtn.style.height = sliderHeight + 'px';
            zoomRangeContainer.style.width = rangeWidth + 'px';
            zoomRangeContainer.style.height = sliderHeight + 'px';
            zoomRangeInput.style.width = rangeWidth + 'px';
            zoomRangeInput.style.height = sliderHeight + 'px';
            zoomRangeInput.style.transformOrigin = '';
            zoomInBtn.style.width = sliderHeight + 'px';
            zoomInBtn.style.height = sliderHeight + 'px';
        }
        else {
            sliderHeight = this.size;
            sliderWidth = this.buttonSize;
            const rangeHeight = sliderHeight - sliderWidth * 2;
            zoomInBtn.style.width = sliderWidth + 'px';
            zoomInBtn.style.height = sliderWidth + 'px';
            zoomRangeContainer.style.width = sliderWidth + 'px';
            zoomRangeContainer.style.height = rangeHeight + 'px';
            zoomRangeInput.style.width = rangeHeight + 'px';
            zoomRangeInput.style.height = sliderWidth + 'px';
            zoomRangeInput.style.transformOrigin = rangeHeight / 2 + 'px ' + rangeHeight / 2 + 'px';
            zoomOutBtn.style.width = sliderWidth + 'px';
            zoomOutBtn.style.height = sliderWidth + 'px';
        }
        this._sliderDiv.style.width = sliderWidth + 'px';
        this._sliderDiv.style.height = sliderHeight + 'px';
        // Reorient the slider, if necessary
        if (reorient) {
            this.reorient();
        }
        // Realign based on new size
        this.realign();
    }
    /**
     * Reorient the slider, changing the transform and the order of the buttons within the div.
     */
    reorient() {
        const zoomOutBtn = this._zoomSliderOut;
        const zoomInBtn = this._zoomSliderIn;
        const zoomRangeInput = this._zoomSliderRange;
        if (this._sliderDiv === null ||
            zoomOutBtn === null ||
            zoomInBtn === null ||
            zoomRangeInput === null)
            return;
        // Need to set the transform of the range input and move the buttons to the correct sides
        if (this.orientation === 'horizontal') {
            zoomRangeInput.style.transform = '';
            this._sliderDiv.insertBefore(zoomOutBtn, this._sliderDiv.firstChild);
            this._sliderDiv.appendChild(zoomInBtn);
        }
        else {
            zoomRangeInput.style.transform = 'rotate(-90deg)';
            this._sliderDiv.insertBefore(zoomInBtn, this._sliderDiv.firstChild);
            this._sliderDiv.appendChild(zoomOutBtn);
        }
    }
    /**
     * Realigns to slider relative to the diagram.
     */
    realign() {
        if (this._diagramDiv === null || this._sliderDiv === null)
            return;
        let sliderWidth = 0;
        let sliderHeight = 0;
        if (this.orientation === 'horizontal') {
            sliderWidth = this.size;
            sliderHeight = this.buttonSize;
        }
        else {
            sliderHeight = this.size;
            sliderWidth = this.buttonSize;
        }
        // Finds the diagram and diagram's parent in the page
        const diagramParent = this._diagramDiv.parentElement;
        const diagramLoc = this._diagramDiv.getBoundingClientRect();
        if (diagramParent !== null) {
            const parentLoc = diagramParent.getBoundingClientRect();
            const top = diagramLoc.top -
                parentLoc.top +
                this.alignment.y * this._diagramDiv.clientHeight +
                this.alignment.offsetY -
                this.alignmentFocus.y * sliderHeight +
                this.alignmentFocus.offsetY;
            const left = diagramLoc.left -
                parentLoc.left +
                this.alignment.x * this._diagramDiv.clientWidth +
                this.alignment.offsetX -
                this.alignmentFocus.x * sliderWidth +
                this.alignmentFocus.offsetX;
            this._sliderDiv.style.top = top + 'px';
            this._sliderDiv.style.left = left + 'px';
        }
    }
    /**
     * Update the value of the slider input to match the diagram's scale.
     */
    scaleToValue() {
        const slider = this._zoomSliderRange;
        if (slider === null)
            return;
        const diagram = this.diagram;
        const A = this._initialScale;
        const B = diagram.commandHandler.zoomFactor;
        const y1 = diagram.scale;
        slider.value = Math.round(Math.log(y1 / A) / Math.log(B)).toString();
    }
    /**
     * Update the diagram's scale to match the value of the slider input.
     */
    valueToScale() {
        const slider = this._zoomSliderRange;
        if (slider === null)
            return;
        const diagram = this.diagram;
        const x = parseFloat(slider.value);
        const A = this._initialScale;
        const B = diagram.commandHandler.zoomFactor;
        diagram.scale = A * Math.pow(B, x);
    }
    /**
     * Remove the slider from the page.
     */
    remove() {
        // Remove the listener attached to diagram
        this.diagram.removeDiagramListener('ViewportBoundsChanged', this.updateOnViewportBoundsChanged);
        if (this._sliderDiv !== null) {
            this._sliderDiv.innerHTML = '';
            if (this._sliderDiv.parentElement) {
                this._sliderDiv.parentElement.removeChild(this._sliderDiv);
            }
            this._sliderDiv = null;
        }
    }
}
