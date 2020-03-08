const express = require('express')
const app = express ()
const fs = require('fs');
var path = require('path');
const uniqueFilename = require('unique-filename')
const os = require('os')
const { Darknet } = require('../darknetjs/darknet');
const cv = require('opencv4nodejs')
const WebSocket = require ('ws');

const darknet = new Darknet ({
	weights: '../endo_kun/yolov3-tiny-train_final.weights',
	config: '../endo_kun/yolov3-tiny-test.cfg',
    namefile: '../endo_kun/names.txt'
});

//const darknet = new Darknet ({
//	weights: '../darknetjs/examples/yolov3-tiny.weights',
//	config: '../darknetjs/examples/yolov3-tiny.cfg',
//    namefile: '../darknetjs/examples/coco.names'
//});

var expressWs = require('express-ws')(app);

app.use(express.static('public'));

app.get('/', (req, res) => res.send('Hello World!'))

app.ws('/ws', function(ws, req) {
	ws.on('message', function(msg) {
		var base64Data = msg.replace(/^data:image\/jpeg;base64,/, "");
		var input = uniqueFilename(os.tmpdir()) + 'jpg'
		var output = uniqueFilename(os.tmpdir()) + '.jpg'
        fs.writeFile(input, base64Data, 'base64', function(err) {
			console.log("detect call start" + new Date().toString());
			var result = darknet.detect(input,{thresh: 0.1})
			console.log("detect call end" + new Date().toString());
			console.log(result)
			const img = cv.imread(input);
			result.forEach((s, i) => {
				if (s.name == 'seed' & s.prob > 0.2){
					var p1 = new cv.Point(s.box.x - s.box.w /2, s.box.y - s.box.h /2);
					var p2 = new cv.Point(s.box.x + s.box.w /2, s.box.y + s.box.h/2);
					img.drawRectangle(p1, p2, new cv.Vec3(0,255,0),2);
				}
			});
			cv.imwrite(output, img);
			fs.readFile(output, { encoding: 'base64' }, function(err, rtn){
				if (ws.readyState === WebSocket.OPEN){
					ws.send('data:image\/jpeg;base64,' + rtn);
				}
				fs.unlink(input, function(err){});
				fs.unlink(output + '.jpg', function(err){});
			});
	
		});
	});
	ws.on('close', function(){
        console.log("connection closed");
    });
  });

app.listen(3030, () => console.log('Example app listening on port 3030!'))

