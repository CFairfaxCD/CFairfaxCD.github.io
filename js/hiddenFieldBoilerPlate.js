(function(funcName, baseObj) {
    "use strict";
    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;
    function ready() {
        if (!readyFired) {
            readyFired = true;
            for (var i = 0; i < readyList.length; i++) {
                readyList[i].fn.call(window, readyList[i].ctx);
            }
            readyList = [];
        }
    }
    function readyStateChange() {
        if ( document.readyState === "complete" ) {
            ready();
        }
    }
    baseObj[funcName] = function(callback, context) {
        if (typeof callback !== "function") {
            throw new TypeError("callback for docReady(fn) must be a function");
        }
        if (readyFired) {
            setTimeout(function() {callback(context);}, 1);
            return;
        } else {
            readyList.push({fn: callback, ctx: context});
        }
        if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
            setTimeout(ready, 1);
        } else if (!readyEventHandlersInstalled) {
            if (document.addEventListener) {
                document.addEventListener("DOMContentLoaded", ready, false);
                window.addEventListener("load", ready, false);
            } else {
                document.attachEvent("onreadystatechange", readyStateChange);
                window.attachEvent("onload", ready);
            }
            readyEventHandlersInstalled = true;
        }
    }
})("docReady", window);

function findParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var i = 0; i < items.length; i++) {
        tmp = items[i].split("=");
        if (tmp[0] === parameterName) {
            result = decodeURIComponent(tmp[1]);
        }
    }
    return result;
}

function updateInputs(fields){
    for(var i = 0; i < fields.length; i++){
        var field = document.getElementById(fields[i].id);
        var value = findParameter(fields[i].paramName);
        field.value = value;
    }
}

docReady(updateInputs, [
        {
            id: 'f_b0308b83392fe01186201cc1de798391',
            paramName: 'utm_source'
        },
        {
            id: 'f_bb8975b1392fe01186201cc1de798391',
            paramName: 'utm_campaign'
        },
        {
            id: 'dummy_id',
            paramName: 'utm_medium'
        }
    ]
);

/* 

    IF JQUERY IS AN OPTION    

*/

function findParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var i = 0; i < items.length; i++) {
        tmp = items[i].split("=");
        if (tmp[0] === parameterName) {
            result = decodeURIComponent(tmp[1]);
        }
    }
    return result;
}

function updateFields(fields) {
    for(var i = 0; i < fields.length; i++){
        $(fields[i].id).val(findParameter(fields[i].paramName))
    }
}

$(
	updateFields([
        {
            id: '#f_b0308b83392fe01186201cc1de798391',
            paramName: 'nope'
        },
        {
            id: '#f_bb8975b1392fe01186201cc1de798391',
            paramName: 'url'
        }
    ])
)