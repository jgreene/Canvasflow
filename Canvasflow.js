// Copyright (c) 2012 Justin Greene
// Canvasflow - A small Coverflow library for the HTML5 canvas
// MIT License

var Canvasflow = (function() {

     var getImageResizeRatio = function(dim, maxWidth, maxHeight) {
        if (dim.width < maxWidth && dim.height < maxHeight) {
            return 1;
        }

        var ratioX = maxWidth / dim.width;
        var ratioY = maxHeight / dim.height;
        return (function() {
            if (ratioX <= ratioY) {
                return ratioX;
            }

            return ratioY;
        })();
    }

    var getImageResizeDimensions = function(dim, maxWidth, maxHeight) {
        if (dim.width < maxWidth && dim.height < maxHeight) {
            return dim;
        }

        var ratioX = maxWidth / dim.width;
        var ratioY = maxHeight / dim.height;

        return (function() {
            var ratio = (function() {
                if (ratioX <= ratioY) {
                    return ratioX;
                }

                return ratioY;
            })();

            return { width: Math.round(dim.width * ratio), height: Math.round(dim.height * ratio) };
        })();
    };

    var resizeImage = function(image, maxWidth, maxHeight) {
        if (image.width < maxWidth && image.height < maxHeight) {
            return image;
        }

        var img = document.createElement('canvas');
        var ctx = img.getContext('2d');

        var dim = getImageResizeDimensions(image, maxWidth, maxHeight);

        img.width = dim.width;
        img.height = dim.height;

        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, dim.width, dim.height);


        return img;
    }

    var FlowImage = (function() {
        return function(stage, image, imgWidth, imgHeight) {
            var self = this;
            self.image = resizeImage(image, imgWidth, imgHeight);
            self.tilt = 0;
            self.scale = 1;
            self.redrawImage = false;

            self.shape = new NinjaJS.Shape(function() {
                var startX = 0;
                var per = 1 / self.scale;
                var transHeight = self.tilt * self.image.width * per;
                var startY = transHeight >= 0 ? 0 : Math.abs(transHeight);

                var canvas = this.getCanvas();
                canvas.width = imgWidth;
                canvas.height = (self.image.height + startY) * 2;
                var ctx = this.getContext();


                ctx.beginPath();
                ctx.setTransform(self.scale, self.tilt, 0, self.scale, 0, 0);
                ctx.rect(startX, startY, self.image.width, self.image.height);
                ctx.drawImage(self.image, startX, startY, self.image.width, self.image.height);

                ctx.closePath();

                var drawReflection = function() {

                    var reflectionY = (startY + (self.image.height * 2));

                    ctx.save();

                    ctx.globalAlpha = 0.3;
                    ctx.translate(0, reflectionY);
                    ctx.scale(1, -self.scale);
                    ctx.drawImage(self.image, 0, 0, self.image.width, self.image.height);

                    ctx.restore();
                };

                drawReflection();

            });

            self.redraw = function() {
                if (self.redrawImage) {
                    self.shape.redraw();
                }
            }
        };
    })();

    return function(settings) {
        var self = this;
        var width = settings.width;
        var height = settings.height;
        var imgHeight = settings.imgHeight ? settings.imgHeight : settings.height / 2;
        var imgWidth = settings.imgWidth ? settings.imgWidth : settings.width / 2;
        var tilt = settings.tilt ? settings.tilt : .2;
        var scale = settings.scale ? settings.scale : .75;
        var padding = settings.padding ? settings.padding : 25;
        var initialY = settings.initialY ? settings.initialY : 0;

        self.current = settings.current ? settings.current : (function() {
            var length = settings.images.length;
            if (length > 2) {
                return Math.floor(length / 2);
            }

            return 0;
        })();

        var stage = new NinjaJS.Stage(settings.container, width, height, settings.actualWidth, settings.actualHeight);

        self.stage = stage;

        self.images = _.map(settings.images, function(img) {
            return new FlowImage(stage, img, imgWidth, imgHeight);
        });

        var middleX = width / 2;
        var offsetX = (imgWidth / 2);

        _.each(self.images, function(image, i) {
            stage.add(image.shape);
        });


        var updateZIndex = function() {
            var currentImage = _.first(_.sortBy(self.images, function(image) {
                var imageCenter = image.shape.x + offsetX;

                var distance = middleX - imageCenter;
                return Math.abs(distance);
            }));

            self.current = _.indexOf(self.images, currentImage);

            var currentZ = 0;

            _.each(self.images, function(image, i) {
                if (i < self.current) {
                    image.shape.z = currentZ;
                    currentZ++;
                }else if (i == self.current) {
                    image.shape.z = currentZ;
                    image.shape.moveToTop();
                }else if (i > self.current) {
                    currentZ--;
                    image.shape.z = currentZ;
                }

                image.redraw();
            });
        }

        var update = function() {
            _.each(self.images, function(image, i) {
                var shape = image.shape;
                var imageCenter = image.shape.x + (offsetX * image.scale);

                var distance = middleX - imageCenter;

                var percentage = Math.abs(distance) / offsetX;

                var oldTilt = image.tilt;
                var oldScale = image.scale;
                image.redrawImage = false;

                image.tilt = (function() {

                    var newTilt = (tilt * percentage);

                    var resultTilt = Math.abs(newTilt) > tilt ? tilt : newTilt;

                    if (imageCenter < middleX) {
                        resultTilt = -resultTilt;
                    }

                    return resultTilt;

                })();

                image.scale = (function() {
                    if (percentage > 1)
                        return scale;

                    var diff = 1 - scale;
                    var per = diff * percentage;

                    var result = 1 - per;

                    if (result < scale)
                        result = scale;

                    return result;
                })();

                if (oldTilt !== image.tilt || oldScale !== image.scale) {
                    image.redrawImage = true;
                }
            });

            updateZIndex();

            stage.reorder();

            stage.draw();
        }

        var initialize = function() {

            _.each(self.images, function(image, i) {
                var shape = image.shape;

                var middlePos = middleX - offsetX;

                var diff = Math.abs(self.current - i);
                var xOffset = ((offsetX) * diff);

                if (i < self.current) {

                    shape.setPosition(middlePos - xOffset - padding, initialY);

                }else if (i === self.current) {
                    shape.setPosition(middlePos, initialY);

                }else if (i > self.current) {
                    shape.setPosition(middlePos + xOffset + padding, initialY);
                }
            });

            update();
        }

        initialize();

        var isAnimating = false;

        var animateToPosition = function(index) {
            if (isAnimating === true) { return; }

            var image = self.images[index];

            if (image == null) { return; }

            var imageCenter = image.shape.x + offsetX;

            var distance = middleX - imageCenter;

            var distanceToMove = Math.floor(distance / 2);

            if (distanceToMove === 0) { return; }

            isAnimating = true;

            setTimeout(function() {
                isAnimating = false;
                _.each(self.images, function(image) {
                    image.shape.move(distanceToMove, 0);
                });


                update();
                animateToPosition(index);


            }, 1000 / 60);


        };

        var clickImage = function(image) {
            var index = _.indexOf(self.images, image);
            if (index === self.current) {
                if (settings.click) {
                    settings.click(index);
                }
            }else {
                self.select(index);
            }
        }

        var container = new NinjaJS.Shape(function() {
            var canvas = this.getCanvas();
            canvas.width = width;
            canvas.height = height;
            var ctx = this.getContext();

            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.closePath();
        });

        self.container = container;

        container.draggable = true;
        container.dragX = true;
        container.dragY = false;

        container.bind('tap', function(e) {
            if (e.taps.length != 1) { return; }

            var shapesClicked = _.filter(stage.shapes, function(shape) {
                if (shape === container) { return false; }

                if (shape.visible === false) { return false; }

                return shape.isPointInPath(e.userPosition.x, e.userPosition.y);
            });

            var ordered = _.sortBy(shapesClicked, function(shape) { return shape.z; });

            var shape = _.last(ordered);
            if (shape == null) { return; }

            shape.trigger('tap', e);
        });

        container.bind('dragmove', function(e) {
            self.moveX(e.draggedX);
        });

        container.bind('dragend', function(e) {
            container.setPosition(0, 0);
            animateToPosition(self.current);
        });

        stage.add(container);
        container.z = 99999999;

        _.each(self.images, function(image) {
            image.shape.bind('tap', function(e) {
                if (e.taps.length !== 1) { return; }

                clickImage(image);
            });
        });


        self.moveX = function(x) {

            _.each(self.images, function(image) {
                image.shape.move(x, 0);
            });

            update();
        };

        self.getCurrentIndex = function() {
            return self.current;
        };

        self.select = function(i) {
            self.current = i;
            animateToPosition(self.current);
        };
    };
})();
