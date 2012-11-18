<h1>jQuery filter.me</h1>
<h2>Filter your images using Canvas, Photoshop Curves &amp; jDataView</h2>

<p>jQuery filter.me is a jQuery dependant script that allows you to apply filters to images using Photoshop .acv Curves Adjustment files. jDataView is used to read the Photoshop file, from which we create a Monotonic Spline Curve representing its data. From this curve the new pixel RGB values can be calculated. These values are then applied using HTML5's canvas element.</p>
<p>Literally any Photoshop curves file can be applied to multiple images with ease. This is a great alternative to using something like PHP's imagemagick to try and replicate similar filtering. It can sometimes be a little slow, especially in mobile browsers, but I'm sure this will improve as canvas becomes more mainstream.</p>

<hr>
<h3>Usage</h3>
<h4>Versions available</h4>
<p>Two versions are available, so have a look below.</p>
<p>
    <ul class="info-list">
        <li><b>Production</b> - This version doesn't read the curves files, and only contains one script. Instead, the RGB values for each filter have been hardcoded into the script, speeding things up but preventing you from using your own curves (.acv) files. Requires only <b>jquery.filterme.js</b>.</li>
        <li><b>Development</b> - Contains all of the scripts, reading the curves (.acv) files each time the page is loaded. This takes a little longer (more files to load), but allows you to apply your own new filters easily (no need to calculate RGB values). This is where the real magic happens. Requires <b>jDataview.js</b>, <b>jspline.js</b> and <b>jquery.filterme.js</b>.</li>
    </ul>
</p>
<br />

<h4>Applying a filter</h4>
<p>Adding the filters is easy. As normal, you'll have to load the scripts (and jQuery) into your site's <code>&#60;head&#62;</code> or in the footer before the <code>&#60;/body&#62;</code>. To intiate the filters, use the script below:</p>
<p><pre><code>&#60;script type="text/javascript"&#62;
jQuery(document).ready(function($) {
    $('.filter').filterme();
});
&#60;/script&#62;</code></pre></p>
<p>Then we add the filter class to the image, alongside the filter data attribute.</p>
<p><pre><code>&#60;img src="photo.jpg" class="filter" data-filter="Nashville" /&#62;</code></pre></p>
<p>And that's it. It should work immediately!</p>
<br />

<h4>Additional Options</h4>
<p>Below are the options you can set when initiating the plugin.</p>
<p><pre><code>$('.filter').filterme({
    desaturate: false   // Value from 0 - 1. 1 equals full desaturation (black & white).
    curves: false       // Object of RGB values in production script, or string name of curves .acv file in development script. 
    vignette: false     // 'true' or 'false'. Add a vignette to the image.
    folder: 'acv/'      // Development script only. Location of the .acv folder, relative to the current file.
    debug: false        // Set to 'true' for script debugging. Logs information along execution in console.
});</code></pre></p>

<hr>
<h3>Resources</h3>
<p>Just some of the resources I've used to create jQuery filter.me. Wouldn't be possible without the great work of others!</p>
<ul class="info-list">
    <li><b>jQuery</b> - <a href="http://jquery.com">http://jquery.com</a></li>
    <li><b>jDataview</b> - <a href="http://github.com/vjeux/jDataView">http://github.com/vjeux/jDataView</a></li>
    <li><b>Monotonic Spline Curves</b> - <a href="http://blog.mackerron.com/2011/01/01/javascript-cubic-splines/">http://blog.mackerron.com/2011/01/01/javascript-cubic-splines/</a></li>
    <li><b>Instagram-like Photoshop Curves files</b> - <a href="http://www.doobybrain.com/2012/08/06/instagram-filters-for-photoshop/">http://www.doobybrain.com/2012/08/06/instagram-filters-for-photoshop/</a></li>
</ul>

<hr>
<h3>Little about me</h3>
<p>I'm a 19 year old aspiring entrepeneur and web developer based in Dublin, Ireland. Having decided to turn down university in Ireland &amp; the UK, I've set out to pursue startup success and make great connections. Love creating things with emerging web technologies, just for the pure challenge of it!</p>
<p>Currently I'm working hard with my first major venture, Riva Slider, which has proven very successful so far. I also hope to create more awesome tools in the future, and to prove that there is a life outside of third level education for young tech entrepeneurs here in Ireland. <b>Please follow me and Riva Slider on Twitter!</b> Feel free to fire any questions my way, I'd be happy to answer them.</p>