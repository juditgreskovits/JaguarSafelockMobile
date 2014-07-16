var refreshRate = 600;
var sockethost = window.location.hostname;
var filter = 0.5;
var xRotation = 0;
var socket;
var startXDrag;
var dragArea;
var emitInterval;

var negativeSound;
var positiveSound;

var userAgentDirectionAdjuster = 1;
var deviceIsInPortraitMode;
var userFingerIsOnScreen;
var vibrationPossible = false;
var gyroDetected = false;


function setup() {

    //
    navigator.vibrate = navigator.vibrate ||
        navigator.webkitVibrate ||
        navigator.mozVibrate ||
        navigator.msVibrate;

    if (navigator.vibrate) {
        console.log('we can vibrate');
        vibrationPossible = true;
    } else {
        vibrationPossible = false;
        console.log('no vibration for you :-(');
    }

    var ua = navigator.userAgent.toLowerCase();
    //console.log(ua);
    console.log("navigator.appName", navigator.appName);
    var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");

    if (isAndroid) {
        userAgentDirectionAdjuster = -1;
    }

    negativeSound = new Howl({
        urls: ['click.mp3', 'click.ogg', 'click.wav'],
        //urls: ['click.mp3'],
        autoplay: false,
        loop: false,
        volume: 1
    });

    positiveSound = new Howl({
        urls: ['clack.mp3', 'clack.ogg', 'clack.wav'],
        //urls: ['sounds/clack.mp3'],
        autoplay: false,
        loop: false,
        volume: 0.1
    });


    emitInterval = setInterval(emitLocation, refreshRate);

    var deviceMotionPropsExist = false;
    for (var i in window.DeviceMotionEvent) {
        deviceMotionPropsExist = true;
    }

    console.log("deviceMotionPropsExist : ", deviceMotionPropsExist);

    if (deviceMotionPropsExist) {
        if (window.DeviceMotionEvent || window.DeviceMotionEvent != undefined) {
            window.ondevicemotion = function (event) {
                if (event.accelerationIncludingGravity.x) {
                    var x = (((event.accelerationIncludingGravity.x) / 9.81));
                    xRotation = x;
                    gyroDetected = true;
                    $("#dragArea").hide();
                }
                else {
                }
            };
        }
        else {
        }
    }
    else {
    }


    socket = new spark44.ChannelConnectWrapper("");
    socket.mobileConnect();

    socket.on('negativeFeedback', socketNegativeFeedback);

    function socketNegativeFeedback(data) {
        console.log("negativeFeedback");
        $("#feedback").text(data.currentNumber);
        negativeSound.play();
        $('html').css("background-color", "white");
    }

    socket.on('positiveFeedback', socketPositiveFeedback);

    function socketPositiveFeedback(data) {
        $("#feedback").text(data.currentNumber);
        positiveSound.play();
        $('html').css("background-color", "green");
        if (vibrationPossible) {
            navigator.vibrate(500);
        }
    }



    $("#codeButton").click(function () {
        negativeSound.play();
        console.log("shoucld emit", $("#codeBox").val());
        socket.emit('authenticationCode', { authenticationCode: $("#codeBox").val() });

    });


    $(window).on("orientationchange", function (event) {
        console.log('orientation has changed to: ', event.orientation);
        if (event.orientation === 'portrait') {
            $("#gameplayDiv").show();
            $("#landscapeDiv").hide();
            deviceIsInPortraitMode = true
        } else {
            $("#gameplayDiv").hide();
            $("#landscapeDiv").show();
            deviceIsInPortraitMode = false
        }

        //$("#x").text(refreshRate);
        useDrag();
        $("#x").text("This device is in " + event.orientation + " mode!");
    });

    socket.emit('isUserPressingOnScreen', { isPressing: false });

    $("#pressMeToKeepScreenAlive").on("touchstart", function () {
        socket.emit('isUserPressingOnScreen', { isPressing: true });
        userFingerIsOnScreen = true;
    });


    $("#pressMeToKeepScreenAlive").on("touchend", function () {
        socket.emit('isUserPressingOnScreen', { isPressing: false })
        userFingerIsOnScreen = false;
    });

    $(window).orientationchange();

    //var prevent = new spark44.PreventIOSSleep();
    //$("#x").text("not preventing sleep...");
}



function useDrag() {
    var windowWidth = $(window).width();
    console.log("using drag: ", windowWidth);
    $("#dragArea").width(windowWidth - 20);
    $("#dragArea").offset({ top: window.innerHeight - 70, left: 10 });
    $("#dragArea").on("touchstart", touchStart);
    $("#dragArea").on("mousedown", mouseStart);
    $("#x").text("using drag");

}

function touchStart(e) {
    e.preventDefault();
    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    startXDrag = parseInt(touch.clientX);

    $("#dragArea").on("touchend", touchEnd);
    $("body").on("touchmove", touchMove);

}

function touchEnd(e) {
    e.preventDefault();
    $("#x").text("touchend: ");
    xRotation = null;

    $("#dragArea").off("touchend", touchEnd);
    $("body").off("touchmove", touchMove);

}
function touchMove(e) {
    e.preventDefault();
    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    var clientX = parseInt(touch.clientX);
    var delta = (startXDrag - clientX) / 300;
    xRotation = -delta;

    $("#x").text("touchmove: " + xRotation);

}



function mouseStart(e) {
    $("#x").text("mouse down : ");
    $(document).on('mousemove', mouseMove);
    $(document).on("mouseup", mouseUp);
    startXDrag = e.clientX;
    userFingerIsOnScreen = true;
    deviceIsInPortraitMode = true;
}
function mouseUp(e) {
    $(document).off('mousemove', mouseMove);
    $(document).off("mouseup", mouseUp);
    xRotation = null;
    $("#x").text("mouse up : ");

}
function mouseMove(e) {
    var delta = (startXDrag - e.clientX) / 300;
    //console.log(delta);
    xRotation = -delta;
    $("#x").text(xRotation);
}




/**
 * sends "acceleration" data package to the socket controller
 */
function emitLocation() {

    console.log("number sent: ", userAgentDirectionAdjuster * xRotation);

    if (userFingerIsOnScreen && deviceIsInPortraitMode) {
        socket.emit('acceleration', { x: userAgentDirectionAdjuster * xRotation, isPressing: userFingerIsOnScreen });
    } else {
        socket.emit('acceleration', { x: 0, isPressing: userFingerIsOnScreen });
    }

}



// Passes connection code
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