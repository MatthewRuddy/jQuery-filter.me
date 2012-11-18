/*
 * jQuery filter.me is Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 * Copyright © 2012 Matthew Ruddy (http://matthewruddy.com).
 *
 * @author Matthew Ruddy
 * @version 1.0
 */
;(function($) {

    /*
     * Main plugin object
     */
    $.filterMe = function(el, options) {

        var base = this,
            filter,
            o;

        // Store the jQuery element and create canvas element
        base.$el = $(el);
        base.canvas = document.createElement('canvas');
        base.ctx = base.canvas.getContext('2d');
        base.url = '';

        /*
         * Initiate filter
         */
        base._init = function() {

            // Get the filter (from the images data-filter attribute)
            filter = $.filterMe.filters[ base.$el.data('filter') ] || false;

            // Get the options
            o = base.options = $.extend({}, $.filterMe.defaults, filter);

            // Trigger actions
            base.$el.trigger('fitlerIO._init', base);

            // Begin the process
            base.process();

        }

        /*
         * Processes and image and applies the effects
         */
        base.process = function() {

            // Check for canvas support before continuing
            if ( !base.canvas.getContext )
                return;

            // Let's go!
            var image = new Image();

            // Get image src and load it
            image.src = base.$el.attr('src');
            image.onload = function() {

                // Set the canvas dimensions
                base.canvas.width = this.width;
                base.canvas.height = this.height;

                // Draw the image onto the canvas
                base.ctx.drawImage( this, 0, 0, this.width, this.height, 0, 0, base.canvas.width, base.canvas.height );

                // Trigger beginning action
                base.$el.trigger('filterMe.processBegin', base);

                // Apply desaturation
                if ( o.desaturate )
                    base.deSaturate( o.desaturate );

                // Apply curves effect
                if ( o.curves )
                    base.addCurves();

                // Apply vignette effect
                if ( o.vignette )
                    base.addVignette();

                // Get the output URL globally (for ease of access)
                base.url = base.outputURL();

                // Output the image!
                base.outputImage();

                // Processing finished action
                base.$el.trigger('filterMe.processEnd', base);

            }

        }

        /*
         * Reads a Photoshop .acv file (using jDataView) and returns the curve points of a polynomial
         */
        base._getACV = function(acv) {

            // Bail if jDataView hasn't been loaded
            if ( !jDataView )
                return false;

            var points = {
                rgb: [],
                r: [],
                g: [],
                b: []
            };

            // Dataview ajax request to the .acv file
            $.ajax({
                url: acv,
                async: false,
                dataType: 'dataview',
                success: function(view) {

                    // Bail if we don't have a view (nothing has been received)
                    if ( !view ) {
                        points = false;
                        return;
                    }

                    // Move internal pointer 4 positions
                    view.seek(4);

                    var length = view.getUint16(),
                        ref = ['r', 'g', 'b'],
                        array,
                        x,
                        y,
                        i,
                        j;

                    // Push the points for the RGB curve
                    points.rgb.push([0, view.getUint16() ]);
                    view.seek( view.tell() + 2 );
                    for ( i = 1; i < length; i++ ) {
                        y = view.getUint16();
                        x = view.getUint16();
                        points.rgb.push([x, y]);
                    }

                    // Some handy debugging for checking RGB values
                    if ( o.debug )
                        console.log( JSON.stringify( points.rgb ) );

                    // Now let's get the individual R, G, B curve points
                    for ( i = 0; i < 3; i++ ) {

                        // Read values and set points array for this curve
                        length = view.getUint16();
                        array = points[ ref[ i ] ];
                        for ( j = 0; j < length; j++ ) {
                            y = view.getUint16();
                            x = view.getUint16();
                            array.push([x, y]);
                        }

                        // More debugging
                        if ( o.debug )
                            console.log( JSON.stringify( array ) );

                    }


                }
            });

            return points;

        }

        /*
         * Gets the curve values for the specified set of curve points
         */
        base._getCurve = function(curvePoints) {

            var curve = [],
                x = [],
                y = [],
                spline,
                p,
                i;

            // Loop through each point
            for ( i = 0; i < curvePoints.length; i++ ) {
                p = curvePoints[ i ];
                x.push(p[0]);
                y.push(p[1]);
            }

            // Create the cubic spline
            cubicSpline = new MonotonicCubicSpline(x, y);

            // Debugging
            if ( o.debug )
                console.log( JSON.stringify( cubicSpline ) );

            // Interpolate values and return the curve
            for ( i = 0; i <= 256; i++ )
                curve[ i ] = Math.round( cubicSpline.interpolate( i ) ) || 0;

            return curve;

        }

        /*
         * Gets the curves values for the various RGB channels
         */
        base._getCurves = function(allPoints) {

            var getCurves = [],
                curves = {},
                i = 0,
                min,
                j;

            /*
             * Handy function for getting lowest value in an array, above a specified value.
             * Found at http://www.webdeveloper.com/forum/showthread.php?254722-Smallest-Value-in-an-Array
             */
            Array.prototype.getLowestAbove = function(a){
                return Math.min.apply( 0,this.filter( function(a) { return a>this; }, a) ) || 0;
            }

            // Get each curve & add them to the curves array
            for ( i in allPoints )
                getCurves.push( base._getCurve( allPoints[ i ] ) );

            // Sort them out
            curves.a = getCurves[0];
            curves.r = getCurves[1];
            curves.g = getCurves[2];
            curves.b = getCurves[3];

            // Remove null values
            for ( i in curves ) {
                min = ( curves[ i ].getLowestAbove(0) - 1 );
                for ( j = 0; j <= curves[ i ].length; j++ ) {
                    if ( curves[ i ][ j ] == 0 )
                        curves[ i ][ j ] = min;
                }
            }

            // As usual, some handy debugging info
            if ( o.debug ) {
                console.log( JSON.stringify( curves.a ) );
                console.log( JSON.stringify( curves.r ) );
                console.log( JSON.stringify( curves.g ) );
                console.log( JSON.stringify( curves.b ) );
            }

            // Return the curves
            return curves;

        }

        /*
         * Does a desaturation
         */
        base._doSaturation = function(saturation) {

            // Saturation fallback
            saturation = saturation || 1;

            // Get image data
            var imageData = base.ctx.getImageData( 0, 0, base.canvas.width, base.canvas.height ),
                data = imageData.data,
                length = data.length,
                average;

            // Apply the desaturation
            for ( var i = 0; i < length; i += 4 ) {
                average = ( data[ i ] + data[ i+1 ] + data[ i+2 ] ) / 3;
                data[ i ] += ( Math.round( average - data[ i ] * saturation ) );
                data[ i+1 ] += ( Math.round( average - data[ i+1 ] * saturation ) );
                data[ i+2 ] += ( Math.round( average - data[ i+2 ] * saturation ) );
            }

            // Restore modified image data
            imageData.data = data;

            return imageData;

        }

        /*
         * Applies a desaturation
         */
        base.deSaturate = function(saturation) {

            // Do the desaturation
            var imageData = base._doSaturation(saturation);

            // Put the image data
            base.putImageData(imageData);

        }

        /*
         * Does a curves adjustment
         */
        base._doCurves = function() {

            var points,
                curves,
                i;

            // Get the curves
            points = base._getACV( o.folder + o.curves +'.acv' );
            curves = base._getCurves(points);

            // Get the canvas image data
            var imageData = base.ctx.getImageData( 0, 0, base.canvas.width, base.canvas.height ),
                data = imageData.data,
                length = data.length;

            // Apply the color R, G, B values to each individual pixel
            for ( i = 0; i < length; i += 4 ) {
                data[ i ] = curves.r[ data[ i ] ];
                data[ i+1 ] = curves.g[ data[ i+1 ] ];
                data[ i+2 ] = curves.b[ data[ i+2 ] ];
            }

            // Apply the overall RGB contrast changes to each pixel
            for ( i = 0; i < length; i += 4 ) {
                data[ i ] = curves.a[ data[ i ] ];
                data[ i+1 ] = curves.a[ data[ i+1 ] ];
                data[ i+2 ] = curves.a[ data[ i+2 ] ];
            }

            // Restore modified image data
            imageData.data = data;

            return imageData;

        }

        /*
         * Applies a curves adjust (aka the filter) to the image
         */
        base.addCurves = function() {

            // Apply the adjustments
            var imageData = base._doCurves();

            // Put the image data
            base.putImageData(imageData);

        }

        /*
         * Adds a vignette effect to the image
         */
        base.addVignette = function() {

            var gradient,
                outerRadius = Math.sqrt( Math.pow( base.canvas.width/2, 2 ) + Math.pow( base.canvas.height/2, 2 ) );

            // Adds outer darkened blur effect
            base.ctx.globalCompositeOperation = 'source-over';
            gradient = base.ctx.createRadialGradient( base.canvas.width/2, base.canvas.height/2, 0, base.canvas.width/2, base.canvas.height/2, outerRadius );
            gradient.addColorStop( 0, 'rgba(0, 0, 0, 0)' );
            gradient.addColorStop( 0.65, 'rgba(0, 0, 0, 0)' );
            gradient.addColorStop( 1, 'rgba(0, 0, 0, 0.6)' );
            base.ctx.fillStyle = gradient;
            base.ctx.fillRect( 0, 0, base.canvas.width, base.canvas.height );

            // Adds central lighten effect
            base.ctx.globalCompositeOperation = 'lighter';
            gradient = base.ctx.createRadialGradient( base.canvas.width/2, base.canvas.height/2, 0, base.canvas.width/2, base.canvas.height/2, outerRadius );
            gradient.addColorStop( 0, 'rgba(255, 255, 255, 0.1)' );
            gradient.addColorStop( 0.65, 'rgba(255, 255, 255, 0)' );
            gradient.addColorStop( 1, 'rgba(0, 0, 0, 0)' );
            base.ctx.fillStyle = gradient;
            base.ctx.fillRect( 0, 0, base.canvas.width, base.canvas.height );

        }

        /*
         * Applies the image data (for example, after pixel maniupulation)
         */
        base.putImageData = function(imageData) {
            base.ctx.putImageData( imageData, 0, 0 );
        }

        /*
         * Outputs the image URL
         */
        base.outputURL = function() {
            var url = base.canvas.toDataURL( 'image/jpeg', 1.0 );
            base.$el.trigger('filterMe.outputURL', url);
            return url;
        }

        /*
         * Outputs the image to the original Image src
         */
        base.outputImage = function() {
            base.$el.trigger('filterMe.outputImage');
            base.$el.attr('src', base.url);
        }

        // Store the data for external usages
        base.$el.data('filterMe', base);

        // Let's begin!
        base._init();

    }

    /*
     * Sets the filters
     */
    $.filterMe.filters = {

        // Instagram style filters
        '1977': { desaturate: false, curves: '1977', vignette: false },
        'Brannan': { desaturate: false, curves: 'Brannan', vignette: false },
        'Gotham': { desaturate: '1', curves: 'Gotham', vignette: false },
        'Hefe': { desaturate: false, curves: 'Hefe', vignette: false },
        'Inkwell': { desaturate: '1', curves: false, vignette: false },
        'Lord Kelvin': { desaturate: false, curves: 'Lord Kelvin', vignette: false },
        'Nashville': { desaturate: false, curves: 'Nashville', vignette: false },
        'X-PRO II': { desaturate: false, curves: 'X-PRO II', vignette: false },

    }

    /*
     * Default plugin options
     */
    $.filterMe.defaults = {
        desaturate: false,
        curves: false, // 1977, Brannan, Gotham, Hefe, Lord Kelvin, Nashville, X-PRO II (these are the names of the .acv curves files, which are essentially the filters themselves).
        vignette: false,
        folder: 'acv/',
        debug: false
    }

    /*
     * jQuery plugin
     */
    $.fn.filterMe = function(options) {
        return this.each(function() {
            new $.filterMe(this, options);
        });
    };

})(jQuery);