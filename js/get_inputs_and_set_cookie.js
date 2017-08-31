// Refactoring notes
// Begin to solve the issue of a clean, simple templating syntax for end-users

// Collects form inputs and writes cookie
var prepareInputs = function(){
    // Collect all inputs on a ClickD Form
    var inputs = clickd_jquery('.clickdform input');
    // collect pre-existing cookie (if it exists)
    var preSaved = fetchInputs();
    // Create Visitor object using makeCookie();
    var Visitor = makeCookie(inputs, preSaved);
    // Write what remains of preSaved, preSaved.lead, and preSaved.contact to the new object
    if(Object.keys(preSaved).length > 0){
        Visitor = addPreSaved(preSaved, Visitor);
    }
    if(preSaved.lead && Object.keys(preSaved.lead).length > 0){
        if(!Visitor.lead){
            Visitor.lead = {};
        }
        Visitor.lead = addPreSaved(preSaved.lead, Visitor.lead);
    }
    if(preSaved.contact && Object.keys(preSaved.contact).length > 0 && Visitor.contact){
        if(!Visitor.contact){
            Visitor.contact = {};
        }
        Visitor.contact = addPreSaved(preSaved.contact, Visitor.contact);
    }
    var cookieString = JSON.stringify(Visitor);
    // Set expiration date
    var d = new Date();
    d.setTime(d.getTime() + (7776000000));
    var expires = "expires=" + d.toUTCString();
    // write the cookie
    document.cookie = 'clickdynamo=' + cookieString + ';' + expires + ';path=/';
}

// fetches cookie and returns array of form inputs
var fetchInputs = function(){
    // Use the getCookie function included below to fetch the cookie
    cookieString = getCookie('clickdynamo');
    // if getCookie returns an empty string, return the empty string
    if (cookieString == '') {
        return cookieString;
    }
    // Parse string into JSON
    savedVisitor = JSON.parse(cookieString);
    return savedVisitor;
}

// called in fetchInputs - fetches a named cookie
var getCookie = function(cookname) {
    var name = cookname + "=";
    // pull all cookies in a decoded format
    var decodedCookie = decodeURIComponent(document.cookie);
    // split cookies into individual cookies
    var ca = decodedCookie.split(';');
    var cString = '';
    // cycle through cookies looking for cookie that begins w/ the defined name (cname)
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        c = c.trim();
        if (c.indexOf(name) == 0) {
            cString = c.substring(name.length, c.length);
        }
    }
    // if no cookie found, return empty string
    return cString;
}

var addPreSaved = function(preSaved, Visitor){
    // Use $.each() to cycle through what remains of the object
    // and assign each remaining property to Visitor
    // delete the property from preSaved after assigning it to Visitor
    clickd_jquery.each(preSaved, function(k, v){
        if(k != 'lead' && k != 'contact') {
            Visitor[k] = v;
            delete preSaved[k];
        }
    });
    return Visitor;
}

var makeCookie = function(inputs, preSaved){
    var excludedInputs = ['cd_postsettings', 'cd_domainalias', 'cd_timezone', 'cd_domain', 'cd_accountkey', 'reqField', '', 'iQapTcha'];
    var Visitor = {};
    console.log(inputs[1].attributes['type'].value);
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
                        if(preSaved.hasOwnProperty(leadField)){
                            Visitor[leadField] = inputs[i].value;
                            delete preSaved[leadField];
                        } else {
                            Visitor[leadField] = inputs[i].value;
                        }
                    } else { 
                        if(leadField != '') {
                            // check if old cookie has lead property and if so, if that lead property
                            // has a property that corresponds to the current property being written
                            if(preSaved.lead && preSaved.lead.hasOwnProperty(leadField)) {
                                // make sure Visitor.lead is instantiated & if not, do so
                                if(!Visitor.lead){
                                    Visitor['lead'] = {};
                                }
                                Visitor.lead[leadField] = inputs[i].value;
                                delete preSaved[leadField];
                            } else {
                                if(!Visitor.lead){
                                    Visitor['lead'] = {};
                                }
                                Visitor.lead[leadField] = inputs[i].value;
                            }
                        }
                        if(contactField != '') {
                            if(preSaved.contact && preSaved.contact.hasOwnProperty(contactField)){
                                if(!Visitor.contact){
                                    Visitor['contact'] = {};
                                }
                                Visitor.contact[contactField] = inputs[i].value;
                                delete preSaved[contactField];
                            } else{
                                if(!Visitor.contact){
                                    Visitor['contact'] = {};
                                }
                                Visitor.contact[contactField] = inputs[i].value;
                            }
                        }
                    }
                } else if(preSaved.hasOwnProperty(inputs[i].name)){
                    Visitor[inputs[i].name] = inputs[i].value;
                    delete preSaved[inputs[i].name];
                } else {
                    Visitor[inputs[i].name] = inputs[i].value;
                }
            }
        }
    
    return Visitor;   
}

var writeValues = function() {
    var loadedVisitor = fetchInputs();
    var valueFields = clickd_jquery('cd');
    valueFields.each(function(i){
        if(loadedVisitor[this.attr('data-dynamo')]) {
            clickd_jquery(this).text(loadedVisitor[clickd_jquery(this).attr('data-dynamo')]) 
        }
    });
    
}