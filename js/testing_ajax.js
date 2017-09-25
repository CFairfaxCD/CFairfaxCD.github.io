function captureSubmit(url, data) {
    console.log(data);
    clickd_jquery.post(url, data)
    .done(function(data){
        console.log("Request successful: " + data);
    })
    .fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request Failed: " + err);
        console.log("Details: " + jqxhr.responseText);
    });
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
