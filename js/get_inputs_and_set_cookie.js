var Visitor = {
    data : {
        contact : {},
        lead : {}
    },
    write : function() {
        Visitor.fetch();
        var inputs = clickd_jquery('.clickdform input, .clickdform select');

        Visitor.update(inputs);

        var cookieString = JSON.stringify(Visitor.data);
        // Set expiration date
        var d = new Date();
        d.setTime(d.getTime() + (7776000000));
        var expires = "expires=" + d.toUTCString();
        // write the cookie
        document.cookie = 'clickdynamo=' + cookieString + ';' + expires + ';path=/';
    },
    render : function() {
        Visitor.fetch();
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
    },
    fetch : function() {
        vString = Visitor.getVCookie('clickdynamo');

        if (vString != '') {
            Visitor.data = JSON.parse(vString);
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
    },
    update : function(inputs) {
        var excludedInputs = ['cd_postsettings', 'cd_domainalias', 'cd_timezone', 'cd_domain', 'cd_accountkey', 'reqField', '', 'iQapTcha'];
        for(i = 0; i < inputs.length; i++){
            // Check to see if the input name exists in the array ecludedInputs
            // Only write values if they are NOT in the array excludedInputs
            if(excludedInputs.indexOf(inputs[i].name) == -1 && inputs[i].value != ''){
                // Check to see if an input has at least a leadfield or contactfield attribute
                var leadField = inputs[i].attributes['leadfield'] ? inputs[i].attributes['leadfield'].value : '';
                var contactField = inputs[i].attributes['contactfield'] ? inputs[i].attributes['contactfield'].value : '';
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
    },
    getVCookie : function(cookname) {
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

function vAttribute(input, iName) {
    if(input.type == 'select-one') {
        this.textValue = input.hasOwnProperty('innerHTML') ? clickd_jquery('option[value="' + clickd_jquery(input).val() + '"]', clickd_jquery(input)).text() : input.textValue;
    }
    this.name = iName;
    this.value = input.value;
    this.type = input.type;
}

vAttribute.prototype.render = function(element) {
    if(this.type == 'select-one') {
        clickd_jquery(element).text(this.textValue);
    } else {
        clickd_jquery(element).text(this.value);
    }
}

if(Object.prototype.toString.call(clickd_jquery) != '[object Function]' && Object.prototype.toString.call(jQuery) == '[object Function]') {
    var clickd_jquery = jQuery.noConflict(true);
} else if(Object.prototype.toString.call(clickd_jquery) != '[object Function]' && Object.prototype.toString.call($) == '[object Function]') {
    var clickd_jquery = $.noConflict(true);
}
clickd_jquery(document).ready(function(){
    Visitor.render();
    clickd_jquery('.clickdform').submit(function(){
        Visitor.write();
    });
});