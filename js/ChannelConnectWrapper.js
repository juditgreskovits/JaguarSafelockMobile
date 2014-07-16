var spark44 = spark44 || {};


spark44.ChannelConnectWrapper = function (mobileClientPage) {

    var messageListeners = {};
    var socket;
    var secretKey = '9ebbae51deb3422dacb1fce686b40815';
    var mobileClient = false;
    var timestamp = Date.now();
    var shorteningService = "https://dcrmstrat-channelconnect.appspot.com/shorten/?url=";





    /**
     * initiate connection with socket controller and request a unique channel
     */
    function connect() {
        socket = studio.innovation.ChannelConnect.getInstance();
        addListeners(socket);
        requestChannels(secretKey);
    }
    spark44.ChannelConnectWrapper.prototype.connect = connect;



    /**
     * intiate connection from a mobile client with the socket controller and request a unique channel
     */
    function mobileConnect(id) {
        mobileClient = true;
        socket = studio.innovation.ChannelConnect.getInstance();
        addListeners(socket);
        // socket.getMobileChannel(getParameter('id'));
        socket.getMobileChannel(id);
    }
    spark44.ChannelConnectWrapper.prototype.mobileConnect = mobileConnect;
    



    /**
     * open the mobile client page in a new window on the same device
     */
    function openMobileClient() {
        if (socket.isConnected()) {
            window.open(
                getMobileClientUrl(),
                'mobile_client',
                'location=1,status=1,menubar=1,resizable=1,width=500,height=700');
        }
    }
    spark44.ChannelConnectWrapper.prototype.openMobileClient = openMobileClient;

    function getMobileClientUrl() {
        return mobileClientPage + '?id=' + socket.getSessionId();
    }




    /**
     * send message via ChannelConnect
     *
     * @param {type} type of data to send
     * @param {vars} data to send
     */
    function emit(type, vars) {
        console.log("ChannelConnectWrapper.emit type = " + type + " | vars = " + vars);
        var message = new studio.innovation.ChannelMessage({
            type: type,
            data: vars
        });
        socket.sendMessage(message);
    }
    spark44.ChannelConnectWrapper.prototype.emit = emit;



    /**
     * attach listener to the socket controller for a particular type
     *
     * @param {type} type to listen for
     * @param {closure} function to call
     */
    function on(type, closure) {
        addMessageListener(type, closure);
    }
    spark44.ChannelConnectWrapper.prototype.on = on;


    
    function addMessageListener(eventType, closure) {
        if (messageListeners[eventType] === undefined) {
            var closures = [closure];
            messageListeners[eventType] = closures;
        }
        else {
            messageListeners[eventType].push(closure);
        }
    }

    function messageHandler(event) {
        var jsonString = event.data.toString().replace('\\n', '');
        var jsonObject = eval('(' + jsonString + ')');
        console.log('Mobile Channel messageHandler: ', jsonObject.data.data);
        for (var i = 0; i < messageListeners[jsonObject.data.type].length; i++) {
            messageListeners[jsonObject.data.type][i](jsonObject.data.data);
        }

        var newTimestamp = Date.now();
        //console.log(newTimestamp - timestamp);
        timestamp = newTimestamp;
    }


    function addListeners(channelConnect) {
        channelConnect.addEventListener(studio.innovation.ChannelEvent.CHANNEL_READY, channelReadyHandler);
        channelConnect.addEventListener(studio.innovation.ChannelEvent.OPEN, openHandler);
        channelConnect.addEventListener(studio.innovation.ChannelEvent.MESSAGE, messageHandler);
        //channelConnect.addEventListener(studio.innovation.ChannelEvent.ERROR, errorHandler);
        //channelConnect.addEventListener(studio.innovation.ChannelEvent.CLOSE, closeHandler);

    }



    function openHandler() {
        if (mobileClient) {
            emit('mobileControllerConnected', {});
            console.log('Mobile Channel Connected: ', socket.getSessionId());

        }
        else {
            console.log('Channel Connected: ', socket.getSessionId());
            getShortenedURL();
        }
    }


    function getShortenedURL() {
        var longUrl = mobileClientPage + '?id=' + socket.getSessionId();
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var response = eval('(' + xhr.responseText + ')');
                console.log(response.id);

            }
        };


        xhr.open('GET',
                 shorteningService +
                 escape(longUrl),
                 true);
        xhr.send();
    }

    function requestChannels(secretKey) {
        if (!socket.isConnected()) {
            console.log('Get Channel');
            socket.requestChannels(secretKey);
        }
    }



    function channelReadyHandler() {
        console.log('Channel Ready');
        connectToChannel();
    }

    function connectToChannel() {
        console.log('Connect To Channel');
        socket.connectToChannel();
    }

};