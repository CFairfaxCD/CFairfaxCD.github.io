'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Visitor = function Visitor() {
    var visitor = {
        data: {
            contact: {},
            lead: {}
        },
        write: function write() {
            // update the visitor.data object and then write updated information to a cookie
            fetch();

            var inputs = clickd_jquery('.clickdform input, .clickdform select');

            update(inputs);

            var cookieString = JSON.stringify(this.data);
            // Set expiration date
            var d = new Date();
            d.setTime(d.getTime() + 7776000000);
            var expires = "expires=" + d.toUTCString();
            // write the cookie
            document.cookie = 'clickdynamo=' + cookieString + ';' + expires + ';path=/';
        },
        render: function render() {
            fetch();
            switchIfs();
            renderAttrs();
            updateInputVals();
        }
    };

    var fetch = function fetch() {
        var vString = getVCookie('clickdynamo');
        // check to make sure the returned cookie is not empty
        if (vString != '') {
            visitor.data = JSON.parse(vString);
            // cycle through the visitor.data object,
            // re-instantiating each property as a vAttribute object
            Object.entries(visitor.data).forEach(function (datum) {
                var key = datum[0];

                Object.entries(visitor.data[key]).forEach(function (child) {
                    var childKey = child[0];
                    if (visitor.data[key][childKey].hasOwnProperty('name')) {
                        visitor.data[key][childKey] = vAttribute(child[1], child[1].name);
                    }
                });
                if (visitor.data[key].hasOwnProperty('name')) {
                    visitor.data[key] = vAttribute(visitor.data[key], visitor.data[key].name);
                }
            });
        }
    };

    var update = function update(inputs) {

        var excludedInputs = ['cd_postsettings', 'cd_domainalias', 'cd_timezone', 'cd_domain', 'cd_accountkey', 'reqField', '', 'iQapTcha'];
        // filter out excluded inputs
        inputs = inputs.filter(function (input) {
            return excludedInputs.indexOf(input.name) === -1 && input.value != '';
        });

        [].concat(_toConsumableArray(inputs)).forEach(function (input) {
            // Check to see if an input has at least a leadfield or contactfield attribute
            // if not, assign an empty string to the variable(s)
            var leadField = input.attributes['leadfield'] ? input.attributes['leadfield'].value : '';
            var contactField = input.attributes['contactfield'] ? input.attributes['contactfield'].value : '';
            // does leadField/contactField contain a value?
            // if so, assign the attribute name using that value
            // otherwise, assign it using the input name
            if (leadField != '' || contactField != '') {
                // check to see if input's leadfield and contactfield values are the same
                // if so, write to the visitor
                // otherwise, write to visitor.lead and/or visitor.contact separately
                if (leadField == contactField) {
                    visitor.data[leadField] = vAttribute(input, leadField);
                } else {
                    if (leadField != '') {
                        visitor.data.lead[leadField] = vAttribute(input, leadField);
                    }
                    if (contactField != '') {
                        visitor.data.contact[contactField] = vAttribute(input, contactField);
                    }
                }
            } else {
                visitor.data[input.name] = vAttribute(input, input.name);
            }
        });
    };

    var switchIfs = function switchIfs() {
        var ifElements = clickd_jquery('cd-if');
        ifElements.each(function (i) {
            var dynamoIf = clickd_jquery(this).attr('data-dy-if');
            if (dynamoIf.indexOf('=') !== -1) {
                dynamoIf = dynamoIf.split('=');
                if (dynamoIf[0] !== '' && dynamoIf[0].indexOf('.') !== -1) {
                    dynamoIf[0] = dynamoIf[0].split('.');
                    if (visitor.data[dynamoIf[0][0]][dynamoIf[0][1]].type == 'select-one' && visitor.data[dynamoIf[0][0]][dynamoIf[0][1]].textValue == dynamoIf[1]) {
                        this.className += ' show';
                    } else if (visitor.data[dynamoIf[0][0]][dynamoIf[0][1]].value == dynamoIf[1]) {
                        this.className += ' show';
                    }
                } else if (dynamoIf[0] != '') {
                    if (visitor.data[dynamoIf[0]].type == 'select-one' && visitor.data[dynamoIf[0]].textValue == dynamoIf[1]) {
                        this.className += ' show';
                    } else if (visitor.data[dynamoIf[0]].value == dynamoIf[1]) {
                        this.className += ' show';
                    }
                }
            }
        });
    };

    var renderAttrs = function renderAttrs() {
        var valueFields = clickd_jquery('cd');
        valueFields.each(function (i) {
            var dynamo = clickd_jquery(this).attr('data-dynamo');
            if (dynamo.indexOf('.') != -1) {
                dynamo = dynamo.split('.');
                if (visitor.data[dynamo[0]][dynamo[1]]) {
                    visitor.data[dynamo[0]][dynamo[1]].render(this);
                }
            } else if (visitor.data[dynamo]) {
                visitor.data[dynamo].render(this);
            }
        });
    };

    // set form input values to visitor data
    var updateInputVals = function updateInputVals() {
        var cdInputs = clickd_jquery('.clickdform input, .clickdform select');
        cdInputs.each(function (i) {
            var leadField = clickd_jquery(this).attr('leadfield') ? clickd_jquery(this).attr('leadfield') : '';
            var contactField = clickd_jquery(this).attr('contactfield') ? clickd_jquery(this).attr('contactfield') : '';
            var inputName = this.name;
            if (leadField != '' || contactField != '') {
                if (leadField == contactField && visitor.data[leadField] && visitor.data[leadField].name == leadField) {
                    clickd_jquery(this).val(visitor.data[leadField].value);
                } else if (visitor.data.lead[leadField] && visitor.data.lead[leadField].name == leadField) {
                    clickd_jquery(this).val(visitor.data.lead[leadField].value);
                } else if (visitor.data.contact[contactField] && visitor.data.contact[contactField].name == contactField) {
                    clickd_jquery(this).val(visitor.data.contact[contactField].value);
                }
            } else if (visitor.data[inputName] && visitor.data[inputName].name == inputName) {
                clickd_jquery(this).val(visitor.data[inputName].value);
            }
        });
    };

    // call cookie from memory - returns the string value of the cookie
    var getVCookie = function getVCookie(cookname) {
        var name = cookname + "=";
        // pull all cookies in a decoded format
        var decodedCookie = decodeURIComponent(document.cookie);
        // split cookies into individual cookies
        var ca = decodedCookie.split(';');
        var cString = '';
        // cycle through cookies looking for cookie that begins w/ name
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            // trim leading spaces
            c = c.trim();
            // if cookie found, set cString to cookie value
            if (c.indexOf(name) == 0) {
                cString = c.substring(name.length, c.length);
            }
        }
        return cString;
    };

    return visitor;
};

// Attribute constructor
var vAttribute = function vAttribute(input, iName) {
    var attribute = {
        render: function render(element) {
            if (this.type == 'select-one') {
                clickd_jquery(element).text(this.textValue);
            } else {
                clickd_jquery(element).text(this.value);
            }
        }
    };
    // check for 'select' inputs and add a human-readable "textValue" to allow for meaningful rendered data
    if (input.type == 'select-one') {
        if (input.innerHTML) {
            var optionText = clickd_jquery('option[value="' + clickd_jquery(input).val() + '"]', clickd_jquery(input)).text().trim();
            if (optionText != '') {
                attribute.textValue = optionText;
                attribute.name = iName;
                attribute.value = input.value;
                attribute.type = input.type;
            }
        } else {
            attribute.textValue = input.textValue;
            attribute.name = iName;
            attribute.value = input.value;
            attribute.type = input.type;
        }
    } else {
        attribute.name = iName;
        attribute.value = input.value;
        attribute.type = input.type;
    }

    return attribute;
};

// This should be served as its own CSS file rather than written to the head by JS
var hideIfs = function hideIfs() {
    var css = 'cd-if { display: none; } cd-if.show { display: inline; }',
        head = document.head || document.getElementsByTagName('head')[0],
        style = document.createElement('style');

    style.type = 'text/css';
    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
};

// generate visitor
if (Object.prototype.toString.call(clickd_jquery) != '[object Function]' && Object.prototype.toString.call(jQuery) == '[object Function]') {
    var clickd_jquery = jQuery.noConflict(true);
} else if (Object.prototype.toString.call(clickd_jquery) != '[object Function]' && Object.prototype.toString.call($) == '[object Function]') {
    var clickd_jquery = $.noConflict(true);
}
clickd_jquery(document).ready(function () {
    hideIfs();
    var v = Visitor();
    v.render();
    clickd_jquery('.clickdform').submit(function () {
        v.write();
    });
});
