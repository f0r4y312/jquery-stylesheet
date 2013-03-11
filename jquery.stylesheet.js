/**
 * jQuery plugin for the stylesheet manipulation
 */
(function ($) {
	var _elStyle = document.createElement('style'),
		_styles = document.createElement('p').style,
		vendorPrefixes = ["Webkit", "O", "Moz", "ms"];
	
	function filterStyleSheet(filter, styleSheet) {
		filter = filter || '';
		var node = $(styleSheet.ownerNode);
		return (filter === '') ||
			('#'+(node.prop('id') || '') == filter) ||
			((node.prop('href') || '') == $(document.createElement('a')).prop('href', filter).prop('href'));
	}
	
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
	
	$.stylesheet = function (selector, name, value) {
		if(!(this instanceof $.stylesheet)) {
			return new $.stylesheet(selector, name, value);
		}
		
		this.init(selector);
		return this.style(name, value);
	};
	
	$.extend($.stylesheet, {
		cssRules: function (selector) {
			if(!selector) {
				return [];
			}
			
			var rules = [],
				filters = selector.split('{'),
				styleSheetFilter = (filters.length > 1) ? $.trim(filters[0]) : '';
			selector = (filters.length > 1) ? $.trim(filters[1].split('}')[0]) : $.trim(selector);
			//NOTE: selector and filter will be treated as case-sensitive
			$(document.styleSheets).not(_elStyle).each(function (i, styleSheet) {
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
		
		cssStyleName: function (name) {
			if(!name) {
				return name;
			}
			
			var camelName = $.camelCase(name);
			return (camelName in _styles) ?
					camelName :
					($.cssProps[name] || ($.cssProps[name] = vendorPropName(camelName)));
		},
		
		cssComputedStyles: function (styles) {
			var computedStyles = {};
			$(styles).each(function () {
				$.each(this, function (key, val) {
					if(val && val.length > 0) {
						computedStyles[key] = val;
					}
				});
			});
			return $(computedStyles);
		}
	});
	
	$.extend($.fn, {
		cssComputedStyles: function () {
			return $.stylesheet.cssComputedStyles($(this));
		}
	});
	
	$.stylesheet.fn = $.stylesheet.prototype = {
		init: function (selector) {
			var rules = [];
			
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
				rules: function() {
					return rules.slice();
				},
				
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
