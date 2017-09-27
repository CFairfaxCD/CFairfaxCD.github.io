function Visitor() {
    // capture 'this' for private methods
    var Visitor = this;
    // establish object member for visitor data
    this.data = {
        contact : {},
        lead : {}
    }

    // update the cookie and write it back to memory
    this.write = function() {
        // update the Visitor.data object and then write updated information to a cookie
        fetch();
        var inputs = clickd_jquery('.clickdform input, .clickdform select');

        update(inputs);

        var cookieString = JSON.stringify(Visitor.data);
        // Set expiration date
        var d = new Date();
        d.setTime(d.getTime() + (7776000000));
        var expires = "expires=" + d.toUTCString();
        // write the cookie
        document.cookie = 'clickdynamo=' + cookieString + ';' + expires + ';path=/';
    }

    // render all called values to the page in this order:
    // display if blocks
    // render visitor data to cd elements
    // set input values to visitor data
    this.render = function() {
        fetch();
        switchIfs();
        renderAttrs();
        updateInputVals();
    }

    // fetch the cookie and update Visitor.data
    function fetch() {
        vString = getVCookie('clickdynamo');
        // check to make sure the returned cookie is not empty
        // may need to set this up to catch an exception when the returned cookie is empty - talk through this
        if (vString != '') {
            Visitor.data = JSON.parse(vString);
            // cycle through the Visitor.data object,
            // re-instantiating each property as a vAttribute object
            for(var key in Visitor.data) {
                if(Visitor.data.hasOwnProperty(key)) {
                    for(var child in Visitor.data[key]) {
                        if(Visitor.data[key].hasOwnProperty(child) && Visitor.data[key][child].hasOwnProperty('name')) {
                            Visitor.data[key][child]  = new vAttribute(Visitor.data[key][child], Visitor.data[key][child].name);
                        }
                    }
                    if(Visitor.data[key].hasOwnProperty('name')) {
                        Visitor.data[key]  = new vAttribute(Visitor.data[key], Visitor.data[key].name);
                    }
                }
            }
        }
    }

    // capture form data and update the Visitor.data object
    function update(inputs) {
        var excludedInputs = ['cd_postsettings', 'cd_domainalias', 'cd_timezone', 'cd_domain', 'cd_accountkey', 'reqField', '', 'iQapTcha'];
        for(i = 0; i < inputs.length; i++){
            // Check to see if the input name exists in the array ecludedInputs
            // Only write values if they are NOT in the array excludedInputs
            if(excludedInputs.indexOf(inputs[i].name) == -1 && inputs[i].value != ''){
                // Check to see if an input has at least a leadfield or contactfield attribute
                // if not, assign an empty string to the variable(s)
                var leadField = inputs[i].attributes['leadfield'] ? inputs[i].attributes['leadfield'].value : '';
                var contactField = inputs[i].attributes['contactfield'] ? inputs[i].attributes['contactfield'].value : '';
                // does leadField/contactField contain a value?
                // if so, assign the attribute name using that value
                // otherwise, assign it using the input name
                if(leadField != '' || contactField != ''){
                    // check to see if input's leadfield and contactfield values are the same
                    // if so, write to the Visitor
                    // otherwise, write to Visitor.lead and/or Visitor.contact separately
                    if(leadField == contactField) {
                        Visitor.data[leadField] = new vAttribute(inputs[i], leadField);
                    } else { 
                        if(leadField != '') {
                            Visitor.data.lead[leadField] = new vAttribute(inputs[i], leadField);
                        }
                        if(contactField != '') {
                            Visitor.data.contact[contactField] = new vAttribute(inputs[i], contactField);
                        }
                    }
                } else {
                    Visitor.data[inputs[i].name] = new vAttribute(inputs[i], inputs[i].name);
                }
            }
        }
    }

        // determine which if statements should be displayed and unhide
    function switchIfs() {
        var ifElements = clickd_jquery('cd-if');
        ifElements.each(function(i){
            var dynamoIf = clickd_jquery(this).attr('data-dy-if');
            if(dynamoIf.indexOf('=') != -1) {
                dynamoIf = dynamoIf.split('=');
                if(dynamoIf[0] != '' && dynamoIf[0].indexOf('.') != -1) {
                    dynamoIf[0] = dynamoIf[0].split('.');
                    if(Visitor.data[dynamoIf[0][0]][dynamoIf[0][1]].type == 'select-one' && Visitor.data[dynamoIf[0][0]][dynamoIf[0][1]].textValue == dynamoIf[1]) {
                        this.style.display = '';
                    } else if(Visitor.data[dynamoIf[0][0]][dynamoIf[0][1]].value == dynamoIf[1]) {
                        this.style.display = '';
                    }
                } else if(dynamoIf[0] != '') {
                    if(Visitor.data[dynamoIf[0]].type == 'select-one' && Visitor.data[dynamoIf[0]].textValue == dynamoIf[1]) {
                        this.style.display = '';
                    } else if(Visitor.data[dynamoIf[0]].value == dynamoIf[1]) {
                        this.style.display = '';
                    }
                }
            }
        });
    }

    // render visitor information to cd elements
    function renderAttrs() {
        var valueFields = clickd_jquery('cd');
        valueFields.each(function(i){
            var dynamo = clickd_jquery(this).attr('data-dynamo');
            if(dynamo.indexOf('.') != -1){
                dynamo = dynamo.split('.');
                if(Visitor.data[dynamo[0]][dynamo[1]]) {
                    Visitor.data[dynamo[0]][dynamo[1]].render(this);
                }
            } else if(Visitor.data[dynamo]) {
                Visitor.data[dynamo].render(this);
            }
        });
    }

    // set form input values to visitor data
    function updateInputVals() {
        var cdInputs = clickd_jquery('.clickdform input, .clickdform select');
        cdInputs.each(function(i){
            var leadField = clickd_jquery(this).attr('leadfield') ? clickd_jquery(this).attr('leadfield') : '';
            var contactField = clickd_jquery(this).attr('contactfield') ? clickd_jquery(this).attr('contactfield') : '';
            var inputName = this.name; 
            if(leadField != '' || contactField != ''){
                if(leadField == contactField && Visitor.data[leadField] && Visitor.data[leadField].name == leadField) {
                    clickd_jquery(this).val(Visitor.data[leadField].value);
                } else if(Visitor.data.lead[leadField] && Visitor.data.lead[leadField].name == leadField) {
                    clickd_jquery(this).val(Visitor.data.lead[leadField].value);
                } else if(Visitor.data.contact[contactField] && Visitor.data.contact[contactField].name == contactField) {
                    clickd_jquery(this).val(Visitor.data.contact[contactField].value);
                }
            } else if(Visitor.data[inputName] && Visitor.data[inputName].name == inputName) {
                clickd_jquery(this).val(Visitor.data[inputName].value);
            }
        });
    }

    // call cookie from memory - returns the string value of the cookie
    function getVCookie(cookname) {
        var name = cookname + "=";
        // pull all cookies in a decoded format
        var decodedCookie = decodeURIComponent(document.cookie);
        // split cookies into individual cookies
        var ca = decodedCookie.split(';');
        var cString = '';
        // cycle through cookies looking for cookie that begins w/ name
        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            // trim leading spaces
            c = c.trim();
            // if cookie found, set cString to cookie value
            if (c.indexOf(name) == 0) {
                cString = c.substring(name.length, c.length);
            }
        }
        return cString;
    }
}

// Attribute constructor
function vAttribute(input, iName) {
    // check for 'select' inputs and add a human-readable "textValue" to allow for meaningful rendered data
    if(input.type == 'select-one') {
        if(input.innerHTML){
            var optionText = clickd_jquery('option[value="' + clickd_jquery(input).val() + '"]', clickd_jquery(input)).text().trim();
            if(optionText != ''){
                this.textValue = optionText;
                this.name = iName;
                this.value = input.value;
                this.type = input.type;
            }
        } else {
            this.textValue = input.textValue;
            this.name = iName;
            this.value = input.value;
            this.type = input.type;
        }
    } else {
        this.name = iName;
        this.value = input.value;
        this.type = input.type;
    }
}

// add the render method to the vAttribute prototype so an individual render method isn't created
// for each individual attribute
vAttribute.prototype.render = function(element) {
    if(this.type == 'select-one') {
        clickd_jquery(element).text(this.textValue);
    } else {
        clickd_jquery(element).text(this.value);
    }
}

// this is necesarry for setup during testing, but should be replaced by default CSS
var hiddenIfs = document.querySelectorAll('cd-if');
hiddenIfs.forEach(function(element){
    element.style.display = 'none';
});

if(Object.prototype.toString.call(clickd_jquery) != '[object Function]' && Object.prototype.toString.call(jQuery) == '[object Function]') {
    var clickd_jquery = jQuery.noConflict(true);
} else if(Object.prototype.toString.call(clickd_jquery) != '[object Function]' && Object.prototype.toString.call($) == '[object Function]') {
    var clickd_jquery = $.noConflict(true);
}
clickd_jquery(document).ready(function(){
    var v = new Visitor();
    v.render();
    clickd_jquery('.clickdform').submit(function(){
        v.write();
    });
});