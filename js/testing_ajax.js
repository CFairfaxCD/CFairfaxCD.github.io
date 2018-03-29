function captureSubmit(url, data) {
    var req = new XMLHttpRequest
    req.addEventListener("load", function(e) {
        console.log('SUCCESS:\n' + e)
    }),
    req.addEventListener("error", function(e) {
        console.log('ERROR:\n' + e)
    }),
    req.open("POST", url),
    req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"),
    req.send(data)
}

clickd_jquery('document').ready(function(){
    clickd_jquery('form').submit(function(e){
        e.preventDefault();
        var formData = clickd_jquery('form').serialize();
        console.log(formData);
        var postURL = clickd_jquery('form').attr('action');
        console.log(postURL);
        captureSubmit(postURL, formData);
    });
});
