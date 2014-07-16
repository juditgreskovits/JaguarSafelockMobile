var spark44 = spark44 || {};

/**
 * hack to prevent iOS devices from sleeping
 *
 */

spark44.PreventIOSSleep = function () {

    var delay = 30000;

    if (window.stop !== undefined){
        var iosSleepPreventInterval = setInterval(openPage, delay);
        
    }


    function openPage() {
        window.location.href = "/new/page";
        //cancel immediately
        window.setTimeout(function () {
            window.stop();
        }, 0);
    }


}