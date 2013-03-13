/**
 * jQuery plugin for the stylesheet manipulation
 * 
 * @author Vimal Aravindashan
 * @version 0.1.1
 * @licensed MIT license
 */
(function ($) {
	var _elStyle = document.createElement('style'), /**< <style> element used as staging area for applying CSS rules */
		_ahref = $(document.createElement('a')), /**< <a> tag used for evaluating hrefs */
		_styles = _ahref.prop('style'), /**< Collection of styles available on the host */
		vendorPrefixes = ["Webkit", "O", "Moz", "ms"]; /**< Case sensitive list of vendor specific prefixes */
	
	/**
	 * @function filterStyleSheet
	 * Filter a stylesheet based on ID or location
	 * @param {String} filter Filter to be applied. id or href of the style element can be used as filters.
	 * @param {CSSStyleSheet} styleSheet StyleSheet to be filtered
	 * @returns {Boolean} true if stylesheet matches the filter, false otherwise
	 */
	function filterStyleSheet(filter, styleSheet) {
		filter = filter || '';
		var node = $(styleSheet.ownerNode);
		return (filter === '') ||
			('#'+(node.prop('id') || '') == filter) ||
			((node.prop('href') || '') == _ahref.prop('href', filter).prop('href'));
	}
	
	/**
	 * @function vendorPropName
	 * Vendor prefixed style property name.
	 * Based on similar function in jQuery library.
	 * @param {String} name camelCased CSS property name
	 * @returns {String} Vendor specific tag @see vendorPrefixes prefixed name if found in styles @see _styles,
	 * else passed name as-is
	 */
	function vendorPropName(name) {
		var titleName = name[0].toUpperCase() + name.slice(1),
			styleName, i = vendorPrefixes.length;
		while( --i ) {
			styleName = vendorPrefixes[i] + titleName;
			if(styleName in _styles) {
				return styleName;
			}
		}
		return name;
	}
	
	/**
	 * jQuery.stylesheet
	 * 
	 * Constructor/Factory method for initializing a jQuery.stylesheet object.
	 * Includes a short-cut to apply style changes immediately.
	 * @param {String} selector CSS rule selector text with optional stylesheet filter  
	 * @param {String|Array|Object} name Name of style property to get/set.
	 * Also accepts array of property names and object of name/value pairs.
	 * @param {String} value If defined, then value of the style property
	 * is updated with it. Unused when name is an object map.
	 * @returns {jQuery.stylesheet|jQuery array} A new jQuery.stylesheet object if name/value is not passed,
	 * or a jQuery array of property value pairs
	 */
	$.stylesheet = function (selector, name, value) {
		if(!(this instanceof $.stylesheet)) {
			return new $.stylesheet(selector, name, value);
		}
		
		this.init(selector);
		return this.style(name, value);
	};
	
	$.extend($.stylesheet, {
		/**
		 * @function jQuery.stylesheet.cssRules
		 * @param {String} selector CSS rule selector text with optional stylesheet filter
		 * @returns {Array} Array of CSSStyleRule objects that match the selector text
		 * and pass the stylesheet filter
		 */
		cssRules: function (selector) {
			if(!selector) {
				return [];
			}
			
			var rules = [],
				filters = selector.split('{'),
				styleSheetFilter = (filters.length > 1) ? $.trim(filters[0]) : '';
			selector = (filters.length > 1) ? $.trim(filters[1].split('}')[0]) : $.trim(selector);
			//NOTE: selector and filter will be treated as case-sensitive
			$(document.styleSheets).not(_elStyle).reverse().each(function (i, styleSheet) {
				if(filterStyleSheet(styleSheetFilter, styleSheet)) {
					$.each((styleSheet.rules || styleSheet.cssRules), function (j, cssRule) {
						if(cssRule instanceof CSSStyleRule && cssRule.selectorText === selector) {
							rules.push(cssRule);
						}
					});
				}
			});
			return rules;
		},
		
		/**
		 * @function jQuery.styesheet.cssStyleName
		 * @param {String} name Hypenated CSS property name
		 * @returns {String} camelCased name if found in host styles, or vendor specific name
		 */
		cssStyleName: function (name) {
			if(!name) {
				return name;
			}
			
			var camelName = $.camelCase(name);
			return (camelName in _styles) ?
					camelName :
					($.cssProps[name] || ($.cssProps[name] = vendorPropName(camelName)));
		},
		
		/**
		 * @function jQuery.stylesheet.cssComputedStyles
		 * Compress the output of jQuery.stylesheet.style() to most applicable resultant styles
		 * NOTE: experimental feature
		 * @param {Array} styles Array of key/value pair objects
		 * @returns {jQuery Object} Object map of final key/value pairs
		 */
		cssComputedStyles: function (styles) {
			var computedStyles = {};
			$(styles).each(function () {
				$.each(this, function (key, val) {
					if(val && val.length > 0 && !(key in computedStyles)) {
						computedStyles[key] = val;
					}
				});
			});
			return $(computedStyles);
		}
	});
	
	$.extend($.fn, {
		/**
		 * @function jQuery.fn.cssComputedStyles
		 * Helper function for chainability
		 * @returns @see jQuery.stylesheet.cssComputedStyles
		 */
		cssComputedStyles: function () {
			return $.stylesheet.cssComputedStyles($(this));
		},
		
		/**
		 * @function jQuery.fn.reverse
		 * Native Object Method Array.reverse for jQuery.
		 * Full credits to Michael Geary (http://www.mail-archive.com/discuss@jquery.com/msg04261.html)
		 */
		reverse: ('reverse' in $.fn) ? $.fn.reverse : [].reverse 
	});
	
	$.stylesheet.fn = $.stylesheet.prototype = {
		/**
		 * @function jQuery.stylesheet.fn.init
		 * Initializes a jQuery.stylesheet object.
		 * Selects a list of applicable CSS rules for given selector @see jQuery.stylesheet.cssRules
		 * @param {String|Array|Object} selector CSS rule selector text(s) with optional stylesheet filter(s)
		 */
		init: function (selector) {
			var rules = []; /**< Array of CSSStyleRule objects matching the selector initialized with */
			
			switch($.type(selector)) {
			case 'string':
				rules = $.stylesheet.cssRules(selector);
				break;
			case 'array':
				$.each(selector, function (idx, val) {
					if($.type(val) === 'string') {
						$.merge(rules, $.stylesheet.cssRules(val));
					} else if(val instanceof CSSStyleRule) {
						rules.push(val);
					}
				});
				break;
			case 'object':
				if(selector instanceof CSSStyleRule) {
					rules.push(val);
				}
				break;
			}
			
			$.extend(this, {
				/**
				 * @function jQuery.stylesheet.rules
				 * @returns {Array} Copy of array of CSSStyleRule objects used by this instance of jQuery.stylesheet 
				 */
				rules: function() {
					return rules.slice();
				},
				
				/**
				 * @function jQuery.stylesheet.style()
				 * @param {String|Array|Object} name Name of style property to get/set.
				 * Also accepts array of property names and object of name/value pairs.
				 * @param {String} value If defined, then value of the style property
				 * is updated with it. Unused when name is an object map.
				 * @returns {jQuery.stylesheet|jQuery array} A new jQuery.stylesheet object if name/value is not passed,
				 * or a jQuery array of property value pairs
				 */
				style: function (name, value) {
					var self = this, styles = $([]);
					
					function addStyleDeclaration(style, prop) {
						var decl = {};
						decl[prop] = style[prop];
						styles.push(decl);
					}
					
					switch($.type(name)) {
					case 'string':
						name = $.stylesheet.cssStyleName(name);
						if(name) {
							$.each(rules, function (i, rule) {
								addStyleDeclaration(rule.style, name);
								if(value !== undefined) {
									rule.style[name] = value;
									addStyleDeclaration(rule.style, name);
								}
							});
						}
						break;
					case 'array':
						$.each(name, function (idx, key) {
							$.merge(styles, self.style(key, value));
						});
						break;
					case 'object':
						$.each(name, function (key, val) {
							$.merge(styles, self.style(key, val));
						});
						break;
					default: /*undefined, null*/
						return self;
					}
					
					return styles;
				}
			});
		}
	};
})(jQuery);
