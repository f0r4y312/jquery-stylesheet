jQuery StyleSheet
=================

jQuery.stylesheet plugin allows you to add, remove and make changes to CSS rules on the fly.

Applying a change to a CSS rule can be more efficient than looping through matching elements
and applying the same change to each, especially if there are many elements,
or if the change triggers multiple expensive paint operations. It can also be useful if you have
applied style classes and then customized the elements with inline styles that you do not wish to
override.

Usage
-----

Include the `jquery.stylesheet.js` javascript as below,

    <script type="text/javascript" src="jquery.stylesheet.js"></script>

or in your minified package, or in one of the many ways available to include a javascript.

> If you intend to use the CSSStyleRule object(s) returned by the `rules()` function with jQuery's animate(),
> please be sure to include the `jquery.stylesheet-animate.js` javascript as well.
> Support for animate() is currently experimental and has so far been tested with only a few properties (more coming soon).

###Basics
We'll walkthrough a simple example to go through the basic usage of jQuery StyleSheet.
Feel free to just skim the blockquotes if you're in a hurry.

Let's first create an instance of a $.stylesheet object. $.stylesheet() is a factory function,
so `new $.stylesheet()` and `$.stylesheet()` basically do the same thing.

> If no rules exist for the selector, then a new CSS rule for this selector will be added when it's styles are being set.
> By default, the new rules are added to the last `style` element introduced into the page by jQuery StyleSheet.
> [Selector filtering](#selector-filtering) can be used to override this default behaviour and the new rules will be added
> to the filtered stylesheet. If no stylesheet matches the filter, or if there is more than one match,
> then rules will be added to the last `style` element.

    var $ss = $.stylesheet('.page');

Now let's check what the value of the `background-attachment` style is
and update it to `scroll` in case the current value is `fixed`.

    if($ss.css('background-attachment') === 'fixed') {
       $ss.css('background-attachment', 'scroll');
    }

Next, let's chain together some changes in the different ways $.stylesheet.css() can be called as a setter.

    $ss.css({'margin-left': '10em', 'background-attachment': 'fixed'}) /* different styles, different values */
       .css(['padding-right', 'height'], '0px')                        /* multiple styles, same value        */
       .css('width', '100%');                                          /* single style and value             */

Finally, in a moment of madness, let's remove this style rule altogether!

    $ss.css(null);

**Chaining**
> Similar to jQuery.css(), the getter calls cannot be chained, only the setter calls can be chained.

**Shorthands**
> Again, similar to jQuery.css(), shorthand style names are not supported.

**Security Restrictions**
> Due to [same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy),
> stylesheets loaded from different domains cannot be accessed or modified.

###One-liners
Get the value for `background-attachment` used in class `.page`:

    $.stylesheet('.page', 'background-attachment');

Set the value for `background-color` to `transparent` in class `.page`:

    $.stylesheet('.page', 'background-color', 'transparent');

Get the values for `background-position`, `padding-right` and `width` in style `div.note`:

    $.stylesheet('div.note', ['background-position', 'padding-right', 'width']);

Set the values for `margin-left` and `height` to `0px` in style `div.note`:
> This is a deviation from the default behaviour of jQuery.css() (as of jQuery v1.9.1)

    $.stylesheet('div.note', ['margin-left', 'height'], '0px');

Set values for different styles:

    $.stylesheet('div.title', {'margin-left': '10em', 'background-attachment': 'fixed'});

These one liners can also be written as follows:

    $.stylesheet('.page').css('background-attachment');
    $.stylesheet('div.note').css(['margin-left', 'height'], '0px');
    $.stylesheet('div.title').css({'margin-left': '10em', 'background-attachment': 'fixed'});

###Selector filtering
Applying changes to rules, or reading the values, when there are multiple declarations of the same rule across
many files, jQuery StyleSheet always uses the rule that would be applied finally.

However, in some cases, it may be necessary to choose a particular CSS rule from a given `<link>` or a `<style>`.
To do so, the selectors can be filtered by using stylesheet location or id.

For the example below, assume that there is a style declaration for `body` in base.css and layout.css
and that the location for the html file is /jquery-stylesheet/.

    <link type="text/css" rel="stylesheet" href="base.css" id="base"/>
    <link type="text/css" rel="stylesheet" href="/jquery-stylesheet/layout.css"/>
    <style type="text/css" id="page">body {margin: 1px; padding: 1px;}</style>
    ...
    $(document).ready(function() {
      console.log($.stylesheet('body').rules());
      console.log($.stylesheet('base.css {body}').rules());
      console.log($.stylesheet('/jquery-stylesheet/base.css {body}').rules());
      console.log($.stylesheet('#base {body}').rules());
      console.log($.stylesheet('../jquery-stylesheet/layout.css {body}').rules());
      console.log($.stylesheet('layout.css {body}').rules());
      console.log($.stylesheet('#page {body}').rules());
      console.log($.stylesheet($.merge(
          $.stylesheet('#page {body}').rules(),
          $.stylesheet.cssRules('body.css {body}')
      )).rules());
    });

**The `*` filter**

> A special * filter allows to select rules that may be part of grouped selectors.
> Do keep in mind that changing properties of rules in grouped selectors
> will also impact other selectors in the same group.

    <style type="text/css">
      .classA {
        font-size: large;
      }
      .classA, .classB {
        font-weight: bold;
      }
      .classB {
        font-style: italic;
      }
    </style>
    ...
    $(document).ready(function() {
      console.log($.stylesheet('.classA').rules());
      console.log($.stylesheet('* {.classA}').rules());
      console.log($.stylesheet('.classB').rules());
      console.log($.stylesheet('* {.classB}').rules());
    });
