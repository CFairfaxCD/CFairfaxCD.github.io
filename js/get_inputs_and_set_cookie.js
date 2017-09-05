var Visitor = {
    data : {
        contact : {},
        lead : {}
    },
    write : function() {
        Visitor.fetch();
        var inputs = clickd_jquery('.clickdform input');

        Visitor.update(inputs);

        var cookieString = JSON.stringify(Visitor.data);
        // Set expiration date
        var d = new Date();
        d.setTime(d.getTime() + (7776000000));
        var expires = "expires=" + d.toUTCString();
        // write the cookie
        document.cookie = 'clickdynamo=' + cookieString + ';' + expires + ';path=/';
    },
    render : function(jQuery) {
        if(typeof clickd_jquery == 'function') {
            var jQuery = clickd_jquery;
        }
        Visitor.fetch();
        var valueFields = jQuery('cd');
        valueFields.each(function(i){
            var dynamo = jQuery(this).attr('data-dynamo');
            if(dynamo.indexOf('.') != -1){
                dynamo = dynamo.split('.');
                if(Visitor.data[dynamo[0]][dynamo[1]]) {
                    jQuery(this).text(Visitor.data[dynamo[0]][dynamo[1]]);
                }
            } else {
                if(Visitor.data[dynamo]) {
                    jQuery(this).text(Visitor.data[dynamo]) 
                }
            }
        }); 
    },
    fetch : function() {
        vString = Visitor.getVCookie('clickdynamo');

        if (vString != '') {
            Visitor.data = JSON.parse(vString);
        }
    },
    update : function(inputs) {
        var excludedInputs = ['cd_postsettings', 'cd_domainalias', 'cd_timezone', 'cd_domain', 'cd_accountkey', 'reqField', '', 'iQapTcha'];
        for(i = 0; i < inputs.length; i++){
            // Check to see if the input name exists in the array ecludedInputs
            // indexOf() returns -1 when the value has no index in the array
            // Only write values if they are NOT in the array excludedInputs
            if(excludedInputs.indexOf(inputs[i].name) == -1 && inputs[i].value != ''){
                    // Check to see if an input has at least a leadfield or contactfield attribute
                if(inputs[i].attributes['leadfield'] || inputs[i].attributes['contactfield']){
                    var leadField = inputs[i].attributes['leadfield'].value;
                    var contactField = inputs[i].attributes['contactfield'].value;
                    // check to see if input's leadfield and contactfield values are the same
                    // if so, write to the Visitor
                    // otherwise, write to Visitor.lead and/or Visitor.contact separately
                    if(leadField == contactField) {
                        Visitor.data[leadField] = inputs[i].value;
                    } else { 
                        if(leadField != '') {
                            Visitor.data.lead[leadField] = inputs[i].value;
                        }
                        if(contactField != '') {
                            Visitor.data.contact[contactField] = inputs[i].value;
                        }
                    }
                } else {
                    Visitor.data[inputs[i].name] = inputs[i].value;
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

function vAttribute(input) {
    this.name = input.name;
    this.value = input.value;
}

window.onload = function() {
    if(typeof jQuery == 'function') {
        jQuery(document).ready(function(){
            Visitor.render(jQuery);
            jQuery('.clickdform').submit(function(){
                Visitor.write();
            });
        });
    } else if(typeof clickd_jquery == 'function') {
        clickd_jquery(document).ready(function(){
            Visitor.render(clickd_jquery);
            clickd_jquery('.clickdform').submit(function(){
                Visitor.write();
            });
        });
    }
}