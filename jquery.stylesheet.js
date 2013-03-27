/**
 * jQuery plugin for the stylesheet manipulation
 * 
 * @author Vimal Aravindashan
 * @version 0.3.0
 * @licensed MIT license
 */
(function ($) {
	var	_ahref = $(document.createElement('a')), /**< <a> tag used for evaluating hrefs */
		_styles = _ahref.prop('style'), /**< Collection of styles available on the host */
		_sheet = function(s) {
			return s.sheet || s.styleSheet;
		}($('<style type="text/css">* {}</style>').appendTo('head')[0]), /**< StyleSheet for adding new rules*/
		_rules = ('rules' in _sheet) ? 'rules' : 'cssRules', /**< Attribute name for rules collection in a stylesheet */
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
		return (filter === '') || (filter === '*') ||
			('#'+(node.prop('id') || '') == filter) ||
			((node.prop('href') || '') == _ahref.prop('href', filter).prop('href'));
	}
	
	/**
	 * @function matchSelector
	 * Matches given selector to selectorText of cssRule
	 * @param {CSSStyleRule} cssRule to match with
	 * @param {String} selector selector string to compare
	 * @param {Boolean} matchGroups when true, selector is matched in grouped style rules
	 */
	function matchSelector(cssRule, selector, matchGroups) {
		if(!(cssRule instanceof CSSStyleRule)) {
			return false;
		}
		
		if(cssRule.selectorText === selector) {
			return true;
		} else if (matchGroups === true) {
			return $($.map(cssRule.selectorText.split(','), $.trim)).filter(function(i) {
				return this.toString() === selector;
			}).length > 0;
		}
	}
	
	/**
	 * @function vendorPropName
	 * Vendor prefixed style property name.
	 * Based on similar function in jQuery library.
	 * @param {String} name camelCased CSS property name
	 * @returns {String} Vendor specific tag prefixed style name
	 * if found in styles, else passed name as-is
	 * @see vendorPrefixes
	 * @see _styles
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
	 * @function insertRule
	 * Cross-browser function for inserting rules
	 * @param {String} selector selectorText for the rule
	 * @param {String} css CSS property-value pair string
	 * @param {Number} index Index position to insert the string;
	 * defaults to end of rules collection
	 */
	function insertRule(selector, css, index) {
		if(!selector || !css) {
			return -1; //NOTE: IE does not like addRule(selector,'',index)
		}
		index = index || this[_rules].length;
		return (this.insertRule) ? this.insertRule(selector+'{'+css+'}', index) : this.addRule(selector, css, index);
	}
	
	/**
	 * @function deleteRule
	 * Cross-browser function for deleting rules
	 * @param {Number|CSSStyleRule} Index of rule to be deleted, or
	 * reference to rule to be deleted from rules collection
	 */
	function deleteRule(rule) {
		var _delfn = this.deleteRule || this.removeRule;
		if($.type(rule) == 'number') {
			_delfn.call(this, rule);
		} else {
			var self = this;
			$.each(this[_rules], function (i, _rule) {
				if(rule === _rule) {
					_delfn.call(self, i);
					return false;
				}
			});
		}
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
	 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
	 * if name/value is not passed, or value of property or object of name/value pairs
	 */
	$.stylesheet = function (selector, name, value) {
		if(!(this instanceof $.stylesheet)) {
			return new $.stylesheet(selector, name, value);
		}
		
		this.init(selector);
		return this.css(name, value);
	};
	
	$.extend($.stylesheet, {
		/**
		 * @function jQuery.stylesheet.cssRules
		 * @param {String} selector CSS rule selector text with optional stylesheet filter
		 * @returns {Array} Array of CSSStyleRule objects that match the selector text
		 * and pass the stylesheet filter
		 */
		cssRules: function (selector) {
			if(!$.stylesheet.isValidSelector(selector)) {
				return [];
			}
			
			var rules = [],
				filters = selector.split('{'),
				styleSheetFilter = (filters.length > 1) ? $.trim(filters[0]) : '';
			selector = $.trim((filters.length > 1) ? filters[1].split('}')[0] : selector)
				.replace(/\s+/g, ' ')
				.replace(/\s*,/g, ','); //TODO: add more selector validation
			//NOTE: selector and filter will be treated as case-sensitive
			$(document.styleSheets).each(function (i, styleSheet) {
				if(filterStyleSheet(styleSheetFilter, styleSheet)) {
					$.merge(rules, $(styleSheet[_rules]).filter(function() {
						return matchSelector(this, selector, styleSheetFilter === '*');
					}));
				}
			});
			return rules.reverse();
		},
		
		/**
		 * @function jQuery.stylesheet.isValidSelector
		 * @param {String} selector selector string to be validated
		 * @returns {Boolean} true if the selector string is valid, false otherwise
		 */
		isValidSelector: function (selector) {
			if(!selector || $.type(selector) !== 'string') {
				return false;
			}
			
			//TODO: add parser for selector validation
			return true;
		},
		
		/**
		 * @function jQuery.stylesheet.camelCase
		 * jQuery.camelCase is undocumented and could be removed at any point
		 * @param {String} hypenated string to be camelCased
		 * @returns {String} camelCased string
		 */
		camelCase: $.camelCase || function( str ) {
			return str.replace(/-([\da-z])/g, function(a){return a.toUpperCase().replace('-','');});
		},
		
		/**
		 * Normalized CSS property names
		 */
		cssProps: $.cssProps || {},
		
		/**
		 * @function jQuery.styesheet.cssStyleName
		 * @param {String} name Hypenated CSS property name
		 * @returns {String} camelCased name if found in host styles, or vendor specific name
		 */
		cssStyleName: function (name) {
			if(!name) {
				return name;
			}
			
			var camelcasedName = $.camelCase(name);
			return (camelcasedName in _styles) ?
					camelcasedName :
					($.cssProps[name] || ($.cssProps[name] = vendorPropName(camelcasedName)));
		}
	});
	
	$.stylesheet.fn = $.stylesheet.prototype = {
		/**
		 * @function jQuery.stylesheet.fn.init
		 * Initializes a jQuery.stylesheet object.
		 * Selects a list of applicable CSS rules for given selector.
		 * @see jQuery.stylesheet.cssRules
		 * @param {String|Array|Object} selector CSS rule selector text(s)
		 * with optional stylesheet filter(s)
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
				 * @returns {Array} Copy of array of CSSStyleRule objects used
				 * by this instance of jQuery.stylesheet 
				 */
				rules: function() {
					return rules.slice();
				},
				
				/**
				 * @function jQuery.stylesheet.css()
				 * @param {String|Array|Object} name Name of style property to get/set.
				 * Also accepts array of property names and object of name/value pairs.
				 * @param {String} value If defined, then value of the style property
				 * is updated with it. Unused when name is an object map.
				 * @returns {jQuery.stylesheet|String|Object} A new jQuery.stylesheet object
				 * if name/value is not passed, or value of property or object of name/value pairs
				 */
				css: function (name, value) {
					var self = this, styles = undefined;
					
					switch($.type(name)) {
					case 'null':
						$.each(rules, function (idx, rule) {
							deleteRule.call(rule.parentStyleSheet, rule);
						});
						//NOTE: Safari seems to replace the rules collection object on insert/delete
						//      Refresh our private collection to reflect the changes
						rules = $.stylesheet.cssRules(selector);
						return self;
					case 'string':
						var stylename = $.stylesheet.cssStyleName(name);
						if(stylename) {
							if(rules.length === 0 && value !== undefined) {
								insertRule.call(_sheet, selector, name+':'+(value || 0));
								//NOTE: See above note on Safari
								// rules = [_sheet[_rules][_sheet[_rules].length-1]] should also work here
								// however, IE has different behaviour for grouped selectors,
								// so it is best to refresh the whole collection
								rules = $.stylesheet.cssRules(selector);
								styles = self;
							} else {
								$.each(rules, function (i, rule) {
									if(rule.style[stylename] !== '') {
										if(value !== undefined) {
											rule.style[stylename] = value;
											styles = self;
										} else {
											styles = rule.style[stylename];
										}
										return false;
									}
								});
								if(styles === undefined && value !== undefined) {
									rules[0].style[stylename] = value;
									styles = self;
								}
							}
						}
						break;
					case 'array':
						styles = {};
						$.each(name, function (idx, key) {
							styles[key] = self.css(key, value);
						});
						if(value !== undefined) {
							styles = self;
						}
						break;
					case 'object':
						$.each(name, function (key, val) {
							self.css(key, val);
						});
						return self;
					default: /*undefined*/
						return self;
					}
					
					return styles;
				}
			});
			/* backward compatibility */
			this.style = this.css;
		}
	};
})(jQuery);
