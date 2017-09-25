function captureSubmit(url, data) {
    console.log(data);
    clickd_jquery.ajax({
        url: url,
        data: data,
        type: 'POST',
        success: function(data){
            console.log(data);
            alert('Submitted!');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
          }
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
