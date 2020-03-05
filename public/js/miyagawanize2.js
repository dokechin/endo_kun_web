$().ready(function(){
    var location = window.location;
    var ws = new WebSocket("ws://" + location.host + "/ws");
    ws.onmessage = function (msg) {
        var target = document.getElementById("target");
        console.log('ws.onmessage');
        console.log(msg.data);
        target.src = msg.data;
    }
    var video = document.getElementById("live");
    var canvas = $("#canvas");
    var ctx = canvas.get()[0].getContext('2d');
    var constraints = {
        audio: false,
        video: true,
    };
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
          video.srcObject = stream;
          video.onloadedmetadata = function (e) {
            video.play();
          };
        })
        .catch(function (err) {
          alert(err.name + ": " + err.message);
    });
    timer = setInterval(
        function () {
            ctx.drawImage(video, 0, 0, 400, 300);
            var data = canvas.get()[0].toDataURL('image/jpeg');
            ws.send(data);
        }, 2000
    );
});