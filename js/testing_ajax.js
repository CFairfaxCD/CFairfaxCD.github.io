function captureSubmit(url, data) {
    console.log(data);
    clickd_jquery.ajax({
        url: url,
        data: data,
        type: 'POST',
        success: function(data){
            console.log(data);
            alert('Submitted!');
        }
    });
}
