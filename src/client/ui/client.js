// Copyright (c) 2012 Titanium I.T. LLC. All rights reserved. See LICENSE.txt for details.
/*global Raphael, $ */

(function() {
	"use strict";

	var SvgCanvas = require("./svg_canvas.js");
	var HtmlElement = require("./html_element.js");
	var HtmlCoordinate = require("./html_coordinate.js");
	var browser = require("./browser.js");
	var failFast = require("../../shared/fail_fast.js");

	var svgCanvas = null;
	var start = null;
	var lineDrawn = false;
	var drawingArea;
	var clearScreenButton;
	var documentBody;
	var windowElement;
	var network;

	exports.initializeDrawingArea = function(elements, realTimeConnection) {
		if (svgCanvas !== null) throw new Error("Client.js is not re-entrant");

		drawingArea = elements.drawingAreaDiv;
		clearScreenButton = elements.clearScreenButton;

		failFast.unlessDefined(drawingArea, "elements.drawingArea");
		failFast.unlessDefined(clearScreenButton, "elements.clearScreenButton");

		documentBody = new HtmlElement(document.body);
		windowElement = new HtmlElement(window);

		svgCanvas = new SvgCanvas(drawingArea);

		drawingArea.preventBrowserDragDefaults();
		sendPointerEventsOverNetwork();
		handleClearScreenClick();
		handleMouseDragEvents();
		handleTouchDragEvents();

		network = realTimeConnection;
		network.connect(window.location.port);

		return svgCanvas;
	};

	exports.drawingAreaHasBeenRemovedFromDom = function() {
		svgCanvas = null;
	};

	function sendPointerEventsOverNetwork() {
		drawingArea.onMouseMove(function(pageOffset) {
			var relativeOffset = drawingArea.relativeOffset(pageOffset);
			network.sendPointerLocation(relativeOffset.x, relativeOffset.y);
		});
	}

	function handleClearScreenClick() {
		clearScreenButton.onMouseClick(function() {
			svgCanvas.clear();
		});
	}

	function handleMouseDragEvents() {
		drawingArea.onMouseDown(startDrag);
		documentBody.onMouseMove(continueDrag);
		windowElement.onMouseUp(endDrag);
	}

	function handleTouchDragEvents() {
		drawingArea.onSingleTouchStart(startDrag);
		drawingArea.onSingleTouchMove(continueDrag);
		drawingArea.onTouchEnd(endDrag);
		drawingArea.onTouchCancel(endDrag);

		drawingArea.onMultiTouchStart(endDrag);
	}

	function startDrag(pageOffset) {
		var relativeCoords = drawingArea.relativeOffset(pageOffset);
		start = new HtmlCoordinate(drawingArea, relativeCoords.x, relativeCoords.y);
	}

	function continueDrag(pageOffset) {
		if (!isCurrentlyDrawing()) return;

		var endCoords = drawingArea.relativeOffset(pageOffset);
		var end = new HtmlCoordinate(drawingArea, endCoords.x, endCoords.y);
		if (!start.equals(end)) {
			svgCanvas.drawLine(start.toRelativeX(), start.toRelativeY(), end.toRelativeX(), end.toRelativeY());
			start = end;
			lineDrawn = true;
		}
	}

	function endDrag() {
		if (!isCurrentlyDrawing()) return;

		if (!lineDrawn) svgCanvas.drawDot(start.toRelativeX(), start.toRelativeY());

		start = null;
		lineDrawn = false;
	}

	function isCurrentlyDrawing() {
		return start !== null;
	}

}());