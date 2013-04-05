/**
 * jQuery plugin for adding, removing and making changes to CSS rules
 * 
 * @author Vimal Aravindashan
 * @version 0.3.3
 * @licensed MIT license
 */
(function ($) {
	var	_ahref = $(document.createElement('a')), /**< <a> tag used for evaluating hrefs */
		_styles = _ahref.prop('style'), /**< Collection of styles available on the host */
		_sheet = function(s) {
			return s.sheet || s.styleSheet;
		}($('<style type="text/css">*{}</style>').appendTo('head')[0]), /**< StyleSheet for adding new rules*/
		_rules = ('cssRules' in _sheet) ? 'cssRules' : 'rules', /**< Attribute name for rules collection in a stylesheet */
		vendorPrefixes = ["Webkit", "O", "Moz", "ms"]; /**< Case sensitive list of vendor specific prefixes */
	
	/**
	 * @function filterStyleSheet
	 * Filter a stylesheet based on ID or location
	 * @param {String} filter Filter to be applied. id or href of the style element can be used as filters.
	 * @param {CSSStyleSheet} styleSheet StyleSheet to be filtered
	 * @returns {Boolean} true if styleSheet matches the filter, false otherwise
	 */
	function filterStyleSheet(filter, styleSheet) {
		filter = filter || '';
		var node = $(styleSheet.ownerNode || styleSheet.owningElement);
		return (filter === '') || (filter === '*') ||
			('#'+(node.prop('id') || '') == filter) ||
			((node.prop('href') || '') == _ahref.prop('href', filter).prop('href'));
	}
	
	/**
	 * @function parseSelector
	 * Splits a jQuery.stylesheet compatible selector into stylesheet filter and selector text
	 * @param {String} selector Selector text to be parsed
	 * @returns {Object} object with two properties 'styleSheet' and 'selectorText'
	 */
	function parseSelector(selector) {
		var styleSheet = (/.*?{/.exec(selector) || ['{'])[0],
			selectorText = (/{.*}/g.exec(selector) || ['{'+selector+'}'])[0];
		return {
			styleSheet: $.trim(styleSheet.substr(0, styleSheet.length-1)),
			selectorText: normalizeSelector(selectorText.substr(1, selectorText.length-2))
		};
	}
	
	/**
	 * @function normalizeSelector
	 * Normalizes selectorText to work cross-browser
	 * @param {String} selectorText selector string to normalize
	 * @returns {String} normalized selector string
	 */
	function normalizeSelector(selectorText) {
		var selector = [], last, len;
		last = _sheet[_rules].length;
		insertRule.call(_sheet, selectorText, ';'); //NOTE: IE doesn't seem to mind ';' as non-empty
		len = _sheet[_rules].length;
		for(var i=len-1; i>=last; i--) {
			selector.push(_sheet[_rules][i].selectorText);
			deleteRule.call(_sheet, i);
		}
		return selector.reverse().join(', ');
	}
	
	/**
	 * @function matchSelector
	 * Matches given selector to selectorText of cssRule
	 * @param {CSSStyleRule} cssRule to match with
	 * @param {String} selectorText selector string to compare
	 * @param {Boolean} matchGroups when true, selector is matched in grouped style rules
	 * @returns true if selectorText of cssRule matches given selector, false otherwise
	 */
	function matchSelector(cssRule, selectorText, matchGroups) {
		if($.type(cssRule.selectorText) !== 'string') {
			return false;
		}
		
		if(cssRule.selectorText === selectorText) {
			return true;
		} else if (matchGroups === true) {
			return $($.map(cssRule.selectorText.split(','), $.trim)).filter(function(i) {
				return this.toString() === selectorText;
			}).length > 0;
		} else {
			return false;
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
	 * @function normalizeRule
	 * Normalizes the CSSStyleRule object to work better across browsers
	 * @param {CSSStyleRule} rule CSSStyleRule object to be normalized
	 * @param {StyleSheet} styleSheet parent stylesheet of the rule
	 * @returns {CSSStyleRule} normalized CSSStyleRule
	 */
	function normalizeRule(rule, styleSheet) {
		//NOTE: this is experimental, however, it does have it's benefits
		//TODO: add more hacks for compatibility with jQuery.animate()
		rule.parentStyleSheet = rule.parentStyleSheet || styleSheet; //XXX: Fix for IE7
		return rule;
	}
	/*
	 * Checking for 'instanceof CSSStyleRule' fails on IE7 but not in IE8, however, the call to normalizeRule() fails on both.
	 * So, we will define our custom CSSStyleRule class on all browsers where normalizeRule() fails.
	 */
	try {
		normalizeRule(_sheet[_rules][0], _sheet);
	} catch(e) {
		CSSStyleRule = function(rule) {
			$.extend(this, rule);
			this.rule = rule; //XXX: deleteRule() requires the original object
		};
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
		var self = this,
			_insfn = self.insertRule ? function (selector, css, index) { this.insertRule(selector+'{'+css+'}', index); } : self.addRule;
		index = index || this[_rules].length;
		try {
			return _insfn.call(self, selector, css, index);
		} catch(e) {
			$.each(selector.split(','), function(i, sel) {
				_insfn.call(self, $.trim(sel), css);
			});
			return -1;
		}
	}
	
	/**
	 * @function deleteRule
	 * Cross-browser function for deleting rules
	 * @param {Number|CSSStyleRule} Index of rule to be deleted, or
	 * reference to rule to be deleted from rules collection
	 */
	function deleteRule(rule) {
		//NOTE: If we are using our custom CSSStyleRule, then CSSStyleRule.rule is the real style rule object
		rule = (rule && rule.rule) ? rule.rule : rule;
		if(!rule) {
			return;
		}
		var self = this,
			_delfn = self.deleteRule || self.removeRule;
		if(!_delfn) { //NOTE: IE7 has issues with rule.parentStyleSheet, so we need to search for the parent stylesheet
			$(document.styleSheets).each(function (i, styleSheet) {
				if($(styleSheet[_rules]).filter(function() {return this === rule;}).length == 1) {
					self = styleSheet;
					_delfn = self.deleteRule || self.removeRule;
					return false;
				}
			});
		}
		if($.type(rule) == 'number') {
			_delfn.call(self, rule);
		} else {
			$.each(self[_rules], function (i, _rule) {
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
			var rules = [],
				filters = parseSelector(selector);
			//NOTE: The stylesheet filter will be treated as case-sensitive
			//      The selectorText filter's case depends on the browser
			$(document.styleSheets).each(function (i, styleSheet) {
				if(filterStyleSheet(filters.styleSheet, styleSheet)) {
					$.merge(rules, $(styleSheet[_rules]).filter(function() {
						return matchSelector(this, filters.selectorText, filters.styleSheet === '*');
					}).map(function() {
						var self = this;
						try { //NOTE: IE8 seems to think 'this' is an 'instanceof CSSStyleRule'
							return normalizeRule(self, styleSheet);
						} catch(e) {
							return normalizeRule(new CSSStyleRule(self), styleSheet);
						}
					}));
				}
			});
			return rules.reverse();
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
		 * jQuery.cssProps is undocumented and could be removed at any point
		 */
		cssProps: $.cssProps || {},
		
		/**
		 * @function jQuery.styesheet.cssStyleName
		 * @param {String} name Hypenated CSS property name
		 * @returns {String} camelCased or vendor specific name if found in host styles
		 */
		cssStyleName: function (name) {
			if(name) {
				var camelcasedName = $.camelCase(name);
				if(camelcasedName in _styles) {
					return camelcasedName;
				} else if (($.cssProps[name] || ($.cssProps[name] = vendorPropName(camelcasedName))) in _styles) {
					return $.cssProps[name];
				}
			}
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
								var filters = parseSelector(selector),
									sheet = $(document.styleSheets).filter(function () {
										return filterStyleSheet(filters.styleSheet, this);
									});
								sheet = (sheet && sheet.length == 1) ? sheet[0] : _sheet;
								insertRule.call(sheet, filters.selectorText, name+':'+value+';');
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
		}
	};
})(jQuery);
