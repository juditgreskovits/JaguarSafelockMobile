var spark44 = spark44 || {};

spark44.FingerprintAnimation = function (imgScale, onFingerprintScanComplete, onFingerOnScreen) {	
	var imgScale = imgScale;
	updateOutput("imgScale = " + imgScale);
	updateOutput('screen.width = ' + screen.width + ' | screen.height = ' + screen.height);
	$('#controls').append('<canvas id="fingerprint"></canvas>');
	var canvas = document.getElementById("fingerprint");
	var context = canvas.getContext("2d");
	context.canvas.width  = window.innerWidth;
  	context.canvas.height = window.innerHeight;
  	
	var canvasOffsetPoint = calculateElementOffsetPoint(canvas);

	var onFingerprintScanComplete = onFingerprintScanComplete;
	var onFingerOnScreen = onFingerOnScreen;

	var img_circle = new Image();
	var img_fp_red = new Image();
	var img_scanline = new Image();
	var img_fp_green = new Image();

	var fpRectangle, scanlineRectangle, scanlineOffsetY;

	var crop = {crop: 0.0, fingerprint: function() {return crop.crop}, circle: function() {return 1-crop.crop}};
	var circleSrcHeight, circleDestHeight;
	var fpRedDestY, fpRedSrcHeight, fpRedDestHeight;
	var scanlineDestY;

	var mouseIsDown = false;

	var scanFingerprintTween;
	var scanComplete = false;

	function showCircle() { 
		drawImage(img_circle);
	}
	spark44.FingerprintAnimation.prototype.showCircle = showCircle;

	function showRedFingerprint() {
		drawImage(img_fp_red);
	}
	spark44.FingerprintAnimation.prototype.showRedFingerprint = showRedFingerprint;

	function showGreenFingerprint() {
		drawImage(img_fp_green);
	}
	spark44.FingerprintAnimation.prototype.showGreenFingerprint = showGreenFingerprint;

	/**
	 * Creates and (re)plays fingerprint scanning animation.
	 * @return {void}
	 */
	function scanFingerPrint() {
		if(scanFingerprintTween) scanFingerprintTween.restart();
		else scanFingerprintTween = TweenLite.to(crop, 3, {delay:0.2, crop:1, ease:Sine.easeInOut, onUpdate:drawAnimation, onComplete:onScanComplete});
	}
	spark44.FingerprintAnimation.prototype.scanFingerPrint = scanFingerPrint;

	/**
	 * Stops the fingerprint scanning animation.
	 * @return {void}
	 */
	function stopFingerPrintScan() {
		if(scanFingerprintTween)
		{
			if(!scanFingerprintTween.paused())
			{
	    		scanFingerprintTween.paused(true);
	    		drawImage(img_circle);
		    	crop.crop = 0.0;
	    	}
		}
	}
	spark44.FingerprintAnimation.prototype.stopFingerPrintScan = stopFingerPrintScan;

	/**
	 * Stores that scanning animation had completed and calls callback.
	 * @return {void}
	 */
	function onScanComplete() {
		scanComplete = true;
		onFingerprintScanComplete();
	}

	/**
	 * Draws the supplied image to the canvas.
	 * @param  {Image} img Image to draw onto the canvas.
	 * @return {void}
	 */
	function drawImage(img) {
		context.clearRect(0, 0, canvas.width, canvas.height);
		canvas.width = canvas.width;

		context.drawImage(img, fpRectangle.x, fpRectangle.y, fpRectangle.width, fpRectangle.width);
	}

	/**
	 * The drawing method for each frame of the scanning animation.
	 * @return {void}
	 */
	function drawAnimation() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		canvas.width = canvas.width;

		var fpRedCrop = crop.fingerprint();
		var circleCrop = crop.circle();

		circleSrcHeight = img_circle.height*circleCrop;
		circleDestHeight = fpRectangle.height*circleCrop;

		fpRedDestY = fpRectangle.y + circleDestHeight;
		fpRedSrcHeight = img_circle.height*fpRedCrop;
		fpRedDestHeight = fpRectangle.height*fpRedCrop;

	    context.drawImage(img_circle, 0, 0, img_circle.width, circleSrcHeight, fpRectangle.x, fpRectangle.y, fpRectangle.width, circleDestHeight);
		context.drawImage(img_fp_red, 0, circleSrcHeight, img_circle.width, fpRedSrcHeight, fpRectangle.x, fpRedDestY, fpRectangle.width, fpRedDestHeight);
		if(fpRedCrop > 0 && fpRedCrop < 1) {
			scanlineDestY = fpRedDestY + scanlineOffsetY;
			context.drawImage(img_scanline, 0, 0, img_scanline.width, img_scanline.height, scanlineRectangle.x, scanlineDestY, scanlineRectangle.width, scanlineRectangle.height);
		}
	}

	/**
	 * Calculate whether the interaction position is close enough to the centre of the target area.
	 * @param  {Event} e             Either a Mouse or a Touch event.
	 * @param  {object} offsetPoint  The offset position of the element the Event is acting on.
	 * @param  {object} rect         The position and size of the target area. 
	 * @param  {Number} maxDist      The maximum distance that the interaction can be from the centre.
	 * @return {Boolean}             Whether we are close enough to the target for the interaction to be valid.
	 */
	function mouseWithinRange(e, offsetPoint, rect, maxDist) {
		var position = e.touches ? e.touches[0] : e;

		var mousePoint = {
			x: position.pageX - offsetPoint.x,
			y: position.pageY - offsetPoint.y
		}

		var centrePoint = {
			x: rect.x + rect.width / 2,
			y: rect.y + rect.height / 2
		}

		var diff = {
			x: centrePoint.x - mousePoint.x,
			y: centrePoint.y - mousePoint.y
		}

		var dist = Math.sqrt(diff.x*diff.x + diff.y*diff.y);
	    return dist <= maxDist;
	}

	/**
	 * Calculate the position and size at which the images need to be drawn.
	 * @param  {Image} img Image to use for the calcualation.
	 * @return {object}    Returns a rectangle with the calculated info.
	 */
	function calculateImageRectangle(img) {
		var imgWidth = img.width * imgScale;
	    var imgHeight = img.height * imgScale;
		return {
			width : imgWidth,
	        height : imgHeight,
	        x : (canvas.width - imgWidth)/2,
	        y : canvas.height*0.25 + (canvas.height*0.75 - imgHeight)/2
		} 
	}

	/**
	 * Calculates the total offset of this element.
	 * @param  {DOM element} element Element that's offset to calculate
	 * @return {object}              Returns a point object with the calculated position.
	 */
	function calculateElementOffsetPoint(element) {
		var offsetX = 0, offsetY = 0; 
		if (element.offsetParent !== undefined) {
	        do {
	            offsetX += element.offsetLeft;
	            offsetY += element.offsetTop;
	        } while ((element = element.offsetParent));
	    }
	    return {
	    	x : offsetX,
	    	y : offsetY
	    }
	}

	canvas.addEventListener('mousedown', function(e) {
		e.preventDefault();
	    mouseIsDown = true;
	    if(mouseWithinRange(e, canvasOffsetPoint, fpRectangle, fpRectangle.width/4)) {
	    	if(scanComplete) onFingerOnScreen(true);
	    	else scanFingerPrint();
	    }
	}, false);

	canvas.addEventListener('mouseup', function(e) {
		e.preventDefault();
	    mouseIsDown = false;
	    onFingerOnScreen(false);
	    stopFingerPrintScan();
	}, false);

	canvas.addEventListener('touchstart', function(e) {
		e.preventDefault();
		mouseIsDown = true;
	    if(mouseWithinRange(e, canvasOffsetPoint, fpRectangle, fpRectangle.width/4)) {
	    	if(scanComplete) onFingerOnScreen(true);
	    	else scanFingerPrint();
	    }
	}, false);

	canvas.addEventListener('touchend', function(e) {
		e.preventDefault();
		mouseIsDown = false;
	    onFingerOnScreen(false);
	    stopFingerPrintScan();
	}, false);

	img_circle.onload = function() {
	    fpRectangle = calculateImageRectangle(img_circle);
	    drawImage(img_circle);
	}
	img_circle.src = "img/circle.png";

	img_fp_red.src = "img/fingerprint_red.png";

	img_scanline.onload = function() {
	    scanlineRectangle = calculateImageRectangle(img_scanline);
	    scanlineRectangle.width = window.innerWidth;
	    scanlineRectangle.x = 0;
	    scanlineOffsetY = -20/250*scanlineRectangle.height;
	}
	img_scanline.src = "img/scanline.png";
}