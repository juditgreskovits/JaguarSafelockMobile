var spark44 = spark44 || {};

spark44.Main = function () {
    
    var userAgentDirectionAdjuster = 1;
    var gyroDetected = false;
    var refreshRate = 200;
    var emitInterval;
    var deviceIsInPortraitMode = true;
    var userFingerIsOnScreen;
    var location = 0;
    var xRotation;

    var socketConnected = false;
    var socket = new spark44.ChannelConnectWrapper("");
    socket.on('GAME_OVER', socketGameOver);
    socket.on('RESTART', socketRestart);

    var imgScale = 1.0;
    if(screen.width <= 320) imgScale = 0.5;
    else if(screen.width <= 720) imgScale = 0.66;

    var fingerprintAnimation;
    var dragControl;
    var controlsCreated;

    var screenToRotateBackTo = game;

    var isMobile=navigator.userAgent.match(/(iPad)|(iPhone)|(iPod)|(android)|(webOS)/i);

    var iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    if(iOS) {
        // var prevent = new spark44.PreventIOSSleep();
    }

    window.addEventListener('resize', onOrientationChange);
    onOrientationChange(); // check window innerWidth / innerHeight
    
    /**
     * Evaluate whether acceleration is available and create fingerprint scanner / draggy thing. 
     * @return {void}
     */
    function createControls() {
        var deviceMotionPropsExist = false;
        for (var i in window.DeviceMotionEvent) {
            deviceMotionPropsExist = true;
        }

        if(isMobile && deviceMotionPropsExist) {
            detectAcceleration();
            fingerprintAnimation = new spark44.FingerprintAnimation(imgScale, onFingerprintScanComplete, onFingerOnScreen);
            $('#activateDial').css('display', 'block');
        }
        else {
            dragControl = new spark44.DragControl(imgScale, onFingerOnScreen, onDragMove);
            $('#controlDial').css('display', 'block');
        }

        controlsCreated = true;
    }

    /**
     * Detect whether acceleration is available.
     * @return {void}
     */
    function detectAcceleration() {
    	var ua = navigator.userAgent.toLowerCase();
	    var isAndroid = ua.indexOf("android") > -1;
		if (isAndroid) userAgentDirectionAdjuster = -1;

        if (window.DeviceMotionEvent || window.DeviceMotionEvent != undefined) {
            window.ondevicemotion = function (event) {
                if (event.accelerationIncludingGravity.x) {
                    var x = (((event.accelerationIncludingGravity.x) / 9.81));
                    xRotation = x;
                    location = userAgentDirectionAdjuster * xRotation;
                    gyroDetected = true;
                }
            };
        }
    }

    /**
     * Once "scanning" completed, connect to socket and show activate state
     * @return {void}
     */
    function onFingerprintScanComplete() {
        userFingerIsOnScreen = true;
    	showActive();
    	connectSocket();
    	emitInterval = setInterval(emitLocation, refreshRate);
    }

    /**
     * Callback function called from the conrol - to show in/active state depending on whether the finger is on the screen.
     * @param  {Boolean} isFingerOnScreen Whether the finger is on the screen
     * @return {void}                   
     */
    function onFingerOnScreen(isFingerOnScreen) {
        userFingerIsOnScreen = isFingerOnScreen;
        if(userFingerIsOnScreen) showActive();
        else showInactive();
    }

    /**
     * Callback function to be used by drag control to update the location.
     * @param  {Number} position Number between 0 and 1
     * @return {void}         
     */
    function onDragMove(position) {
        location = position - 0.5;
        if(emitInterval == undefined) onFingerprintScanComplete();
    }

    /**
     * Connect the socket.
     * @return {void}
     */
    function connectSocket() {
    	socket.mobileConnect(getParameter("id"));
    }

    /**
     * Send the location to the banner via the socket.
     * @return {void} 
     */
    function emitLocation() {
        updateOutput(location);
	    if (userFingerIsOnScreen && deviceIsInPortraitMode) {
	        socket.emit('acceleration', { x: location, isPressing: userFingerIsOnScreen });
	    }
        else {
	        socket.emit('acceleration', { x: 0, isPressing: userFingerIsOnScreen });
	    }
	}

    /**
     * Event listener for game over sent by the socket connection.
     * @param  {object} data Object containing info of won / lost and duration in millisecs.
     * @return {void}      
     */
	function socketGameOver(data) {
		if(data.won == true)
		{
			var time = data.time;
			var milli = time%1000
			var sec = Math.floor(time/1000);
			var min = Math.floor(sec/60);
			sec = sec%60;
			document.getElementById("#gameWinTime").innerHTML = formatNumber(min, 2) + ":" + formatNumber(sec, 2) + ":" + formatNumber(milli, 3); 
			showGameWin();
		}
		else
		{ 
			showGameLose();
		}
	}

    /**
     * Events listener for restart sent by the socket connection.
     * @param  {object} data Not sure whetehr this contains anything or what, certainly we don't use it...
     * @return {void}      
     */
    function socketRestart(data) {
        TweenLite.to(gameWin, 0.0, {autoAlpha:0});
        TweenLite.to(gameLose, 0.0, {autoAlpha:0});

        TweenLite.to(game, 0.3, {delay:0.2, autoAlpha:1});
    }

    /**
     * Formats numbers to strings of the specified length.
     * @param  {Number} number Number to format
     * @param  {Number} length Length to format to 
     * @return {void}        
     */
	function formatNumber(number, length) {
		var string = number.toString();
		while(string.length < length)
		{
			string = "0" + string;
		}
		return string;
	}

    /**
     * Gets a query string.
     * @param  {String} name Name of uery string to get.
     * @return {String}      Value of the query string.
     */
    function getParameter(name) {
	    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
	    var pattern = '[\\?&]' + name + '=([^&#]*)';
	    var regex = new RegExp(pattern);
	    var results = regex.exec(window.location.href);
	    if (results == null) {
	        return '';
	    } else {
	        console.log("results", results[1]);
	        return results[1];
	    }
	}

    /**
     * Event listener for orientation change, shows warning screen / last screen one was on.
     * @return {void} 
     */
	function onOrientationChange()
    {
        if(isMobile) {
            if(window.innerWidth > window.innerHeight)
            {
                showRotateBack();
                deviceIsInPortraitMode = false;
                document.getElementById("app").className = "landscape";
            }
            else
            {
                TweenLite.to(rotateBack, 0.0, {autoAlpha:0});
                TweenLite.to(screenToRotateBackTo, 0.3, {delay:0.2, autoAlpha:1});
                deviceIsInPortraitMode = true;
                document.getElementById("app").className = "portrait";
            }
        }
        else if(controlsCreated) {
            dragControl.reposition();
        }
        if(!controlsCreated) createControls();
    }

    
    function showInactive() {
        if(fingerprintAnimation != undefined) {
            fingerprintAnimation.showCircle();
            TweenLite.to(activateDial, 0.2, {autoAlpha:1});
        }
        else {
            TweenLite.to(controlDial, 0.2, {autoAlpha:1});
        }
        // show not active / hide active
        // show grey dials / hide red dials
        document.getElementById("game").className = "inactive";
        document.getElementById("statusInactive").visibility = "visible";
        // show instruction copy / hide number & countdown
        
    }

    function showActive() {
        if(fingerprintAnimation != undefined) {
            fingerprintAnimation.showRedFingerprint();
            TweenLite.to(activateDial, 0.3, {autoAlpha:0});
        }
        else {
            TweenLite.to(controlDial, 0.3, {autoAlpha:0});
        }

        // show active / hide not active
        // show red dials / hide grey dials
        document.getElementById("game").className = "active";
        // show number & countdown / hide instruction
        
    }

    function showGameWin() {
        TweenLite.to(game, 0.3, {autoAlpha:0});
        TweenLite.to(gameWin, 0.3, {delay:0.2, autoAlpha:1});
        screenToRotateBackTo = gameWin;
    }

    function showGameLose() {
        TweenLite.to(game, 0.3, {autoAlpha:0});
        TweenLite.to(gameLose, 0.3, {delay:0.2, autoAlpha:1});
        screenToRotateBackTo = gameLose;
    }

    function showRotateBack() {
        TweenLite.to(game, 0.0, {autoAlpha:0});
        TweenLite.to(gameWin, 0.0, {autoAlpha:0});
        TweenLite.to(gameLose, 0.0, {autoAlpha:0});

        TweenLite.to(rotateBack, 0.3, {delay:0.2, autoAlpha:1});
    }
}