var spark44 = spark44 || {};

spark44.DragControl = function (imgScale, onFingerOnScreen, onDragMove) {
	var imgScale = imgScale;
	var onFingerOnScreen = onFingerOnScreen;
	var onDragMove = onDragMove;
	// create html elements
	$('#controls').append('<div id="dragLine"></div>');
	$('#controls').append('<div id="dragCircle"></div>');

	// position
	
	var lineLeft;
	var lineWidth;
	var circleWidth;
	var circleOffset;
	var circleLeft;

	var lineY;
	var circleY;

	// functionality
	
	function position() {
		lineLeft = $('#dragLine').position().left;
		lineWidth = $('#dragLine').width();
		circleWidth = $('#dragCircle').width()*0.6*imgScale;
		circleOffset = ($('#dragCircle').width() - circleWidth)/2;
		circleLeft = lineLeft - circleOffset + (lineWidth - circleWidth)/2;
		$('#dragCircle').css('left', circleLeft);

		lineY = $('#dragLine').position().top;
		circleY = lineY - $('#dragCircle').height()/2;
		$('#dragCircle').css('top', circleY);
	}
	spark44.DragControl.prototype.reposition = position;

	position();
	
	// functionality
	
	var mouseIsDown = false;
	
	$('#dragCircle').on('mousedown', mouseDown);
	$('#dragCircle').on('touchstart', mouseDown);

	function mouseUp(e) {
		e.preventDefault();
		$(window).on('mouseup', false);
	    $(window).on('mousemove', false);
	    $(window).on('touchend', false);
	    $(window).on('touchmove', false);
	    mouseIsDown = false;
	    onFingerOnScreen(false);
	}

	function mouseDown(e){
		e.preventDefault();
		if(!mouseIsDown) {
			console.log("mouseDown");
			$(window).on('mouseup', mouseUp);
			$(window).on('mousemove', dragMove);
			$(window).on('touchend', mouseUp);
			$(window).on('touchmove', dragMove);
			mouseIsDown = true;
		}
		onFingerOnScreen(true);
	}

	function dragMove(e){
		e.preventDefault();
		if(mouseIsDown) {
			var position = e.originalEvent.touches ? e.originalEvent.touches[0] : e;
			var left = position.pageX - circleWidth/2;
			if(left < lineLeft) left = lineLeft;
			if (left > lineLeft + lineWidth - circleWidth) left = lineLeft + lineWidth - circleWidth;
			$('#dragCircle').css('left', left - circleOffset);
			var ratio = (left - lineLeft)/(lineWidth - circleWidth);
			onDragMove(ratio);
		}
	}
}