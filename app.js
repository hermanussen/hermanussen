const GIFEncoder = require('gifencoder');
const { createCanvas } = require('canvas');
var Canvas = require('canvas');
const fs = require('fs');
const width = 800;
const height = 600;

var isAlive = function(imgData, i) {
    if(i >= imgData.data.length || i < 0)
        return 0;
    return imgData.data[i] !== 0 ? 1 : 0;
}

fs.readFile(__dirname + '/robin.png', function(err, data) {
    if (err) throw err;
    const encoder = new GIFEncoder(width, height);

    // stream the results as they are available into result.gif
    encoder.createReadStream().pipe(fs.createWriteStream('result.gif'));

    encoder.start();
    encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
    encoder.setDelay(100);  // frame delay in ms
    encoder.setQuality(10); // image quality. 10 is default.

    // use node-canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const m = new Date();
    const timeStamp = `${m.getUTCFullYear()}-${("0" + (m.getUTCMonth()+1)).slice(-2)}-${("0" + m.getUTCDate()).slice(-2)} ${("0" + m.getUTCHours()).slice(-2)}:${("0" + m.getUTCMinutes()).slice(-2)}:${("0" + m.getUTCSeconds()).slice(-2)}`;
        
    // Create image for photo
    var imgRobin = new Canvas.Image;
    imgRobin.src = data;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(imgRobin, width / 2 - imgRobin.width / 2, height / 2 - imgRobin.height / 2 - 20, imgRobin.width, imgRobin.height);
    ctx.fillStyle = '#000000';
    ctx.font = '30px Arial, Helvetica';
    ctx.fillText(`Robin Hermanussen - Rendered ${timeStamp}`, 30, height - 60);
    ctx.fillText(`Conway's game of life applied to these pixels`, 30, height - 30);

    var imgData = ctx.getImageData(0, 0, width, height);

    // Make a black and white image of it
    var i;
    for (i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i + 3] = 255;
        if((imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) >= (255 * 3 / 2 * 1.2)) {
            imgData.data[i] = 0;
            imgData.data[i + 1] = 0;
            imgData.data[i + 2] = 0;
        } else {
            imgData.data[i] = 255;
            imgData.data[i + 1] = 255;
            imgData.data[i + 2] = 255;
        }
    }

    ctx.putImageData(imgData, 0, 0);

    // Add the frame a bunch of times, to make the opening slide stay up a while
    for(let i = 0; i < 30; i++) {
        encoder.addFrame(ctx);
    }

    // Apply game of life
    const generations = 1000;
    for(let it = 0; it < generations; it++) {
        let targetImgData = ctx.createImageData(width, height);

        for (let i = 0; i < imgData.data.length; i += 4) {
            let alive = isAlive(imgData, i);

            let aliveTopLeft = isAlive(imgData, i - (width * 4) - 4);
            let aliveTop = isAlive(imgData, i - (width * 4));
            let aliveTopRight = isAlive(imgData, i - (width * 4) + 4);
            let aliveRight = isAlive(imgData, i + 4);
            let aliveBottomRight = isAlive(imgData, i + (width * 4) + 4);
            let aliveBottom = isAlive(imgData, i + (width * 4));
            let aliveBottomLeft = isAlive(imgData, i + (width * 4) - 4);
            let aliveLeft = isAlive(imgData, i - 4);

            let aliveNeighbours = aliveTopLeft + aliveTop + aliveTopRight + aliveRight + aliveBottomRight + aliveBottom + aliveBottomLeft + aliveLeft;

            if(alive && (aliveNeighbours < 2 || aliveNeighbours > 3)) {
                alive = false;
            } else if(!alive && aliveNeighbours == 3) {
                alive = true;
            }

            targetImgData.data[i] = targetImgData.data[i + 1] = targetImgData.data[i + 2] = alive ? 255 : 0;
            targetImgData.data[i + 3] = 255;
        }

        const precision = 10; // lower is better precision; skips fewer generations for rendering
        if(it % precision == 0) {
            console.log(`Rendering frame ${it / precision + 1} of ${generations / precision}`)
            ctx.putImageData(targetImgData, 0, 0);
            encoder.addFrame(ctx);
        }

        imgData = targetImgData;
    }
    
    encoder.finish();
});