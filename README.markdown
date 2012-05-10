Canvasflow - A HTML5 Canvas Coverflow like library.
=======================================

Canvasflow is an HTML5 Canvas library that creates a Coverflow like effect on an HTML5 canvas.  Just point it at some images and set a few variables and you should be good to go.

Dependencies: [underscore.js](http://documentcloud.github.com/underscore/),
    [ninja.js](https://github.com/jgreene/NinjaJS)

Useage:

    var imageUrls = ['image1.png', 'image2.png', image3.png'];

    loadImages(imageUrls, function(images){
        var container = document.getElementById('canvasflow-container');
        var flow = new Canvasflow({
            width: 400,
            height: 400,
            container: container,
            images: images
        });
    });


    function loadImages(imageUrls, after){
        var images = [];
        var i = 0;
        imageUrls.forEach(function(url){
            var image = new Image();
            image.onload = function(e){
                i++;
                images.push(image);
                if(i == imageUrls.length){
                    after(images);
                }
            };

            image.src = url;
        });
    });

    

    

The Canvasflow object:

* Required options
    - width, height, container, images
* Optional arguments
    - click: this fires when the currently selected image is clicked/tapped
            click: function(index){
                var img = images[index];
                //do something
            }
    - actualWidth, actualHeight: these will resize the canvas without warping any images
    - imgWidth, imgHeight: these will resize the images you provide without warping them
    - tilt: this is the tilt used when rendering offset images, defaults to .2
    - padding: padding between images, defaults to 25
    - scale: determines the scale of the images when not selected, defaults to .75
    - current: index of the initial starting image, defaults to the middle of your images array
    - initialY: determines the starting Y coordinate for drawing images on the stage
* Methods
    - getCurrentIndex() : returns the currently selected images index
    - select(index) : takes an index and animates the flow to the image associated with that index
    - flow.stage : returns the NinjaJS stage property; this is so you can draw your own shapes in the same canvas
     
        
