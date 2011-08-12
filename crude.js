/**
 * @preserve Copyright (c) 2011, Vladimir Agafonkin, CloudMade
 * Crude is a JavaScript library that simplifies working with RESTful services.
 * See https://github.com/CloudMade/Crude for more information.
 */

(function(global, undefined) {
	
	var Crude = {},
		oldCrude = global.Crude;
	
	
	if (typeof module != 'undefined' && module.exports) {
		module.exports = Crude;
	} else {
		global['Crude'] = Crude;
	}
	
	
	Crude.api = function(baseUrl, format, requestFn) {
		return new Crude._Api(baseUrl, format, requestFn);
	};
	
	
	Crude.noConflict = function() {
		global['Crude'] = oldCrude;
		return this;
	};
	
	
	Crude._Api = function(baseUrl, format, requestFn) {
		this._baseUrl = baseUrl;
		this._format = format;
		this._requestFn = requestFn;
	};
	
	Crude._Api.prototype = {
		request: function(path, method, data) {
			if (!data && typeof method != 'string') {
				data = method;
				method = 'get';
			}
			data = data || {};
			
			var url = this._baseUrl + '/' + path + '.' + this._format;
			
			url = url.replace(/{ *([^} ]+) *}/g, function(a, key){
				var value = data[key];
				if (value === undefined) {
					throw new Error('No value provided for variable: ' + key);
				}
				delete data[key];
				return value;
			});
			
			return this._requestFn(url, method, data);
		},
		
		resources: function(name, pluralName) {
			pluralName = pluralName || Crude._pluralize(name);
			var resources = this[pluralName] = new Crude._Resources(this, name, pluralName);
			return resources;
		}
	};
	
	
	Crude._Resources = function(api, name, pluralName, prefix) {
		this._api = api;
		this._name = name;
		this._pluralName = pluralName;
		this._prefix = prefix;
	};
	
	Crude._Resources.prototype = {
		request: function(path, method, data) {
			var prefix = (this._prefix ? this._prefix + '/' : ''),
				postfix = (path ? '/' + path : '');
			
			return this._api.request(prefix + this._pluralName + postfix, method, data);
		},
	
		get: function(id, data) {
			if (!data && typeof id == 'object') {
				data = id;
				id = null;
			}
			return this.request(id || '', 'get', data);
		},
		
		create: function(props, data) {
			var props = Crude._wrapKeys(props, this._name),
				data = Crude._extend({}, data, props);
			
			return this.request('', 'post', data);
		},
		
		update: function(id, props, data) {
			var props = Crude._wrapKeys(props, this._name),
				data = Crude._extend({}, data, props);
			
			return this.request(id, 'put', data);
		},
		
		del: function(id, data) {
			return this.request(id, 'delete', data);
		},
		
		belongTo: function(parent) {
			var methodName = 'in' + Crude._capitalize(parent._name);
			this[methodName] = function(id) {
				function NestedResources() {
					Crude._Resources.apply(this, arguments);
				}
				Crude._inherit(NestedResources, Crude._Resources);
				
				var protoAccessorName = parent._name + Crude._capitalize(this._pluralName);
				this._api[protoAccessorName] = NestedResources.prototype;
				
				var prefix = parent._pluralName + '/' + id;
				return new NestedResources(this._api, this._name, this._pluralName, prefix);
			};
			return this;
		},
		
		memberAction: function(name, options) {
			// options: path, method, argsToDataFn
			// TODO member action
			return this;
		},
		
		collectionAction: function(name, options) {
			// TODO collection action
			return this;
		}
	};
	
	
	Crude.pluralRules = [[/$/, 's'],
	                     [/s$/i, 's'],
	                     [/(?:([^f])fe|([lr])f)$/i, '$1$2ves'],
	                     [/([^aeiouy]|qu)y$/i, '$1ies'],
	                     [/(x|ch|s|sh)$/i, '$1es'],
	                     ['child', 'children']];
	
	Crude._pluralize = function(name) {
		var rules = Crude.pluralRules,
			i = rules.length, rule;
		
		while (i--) {
			rule = rules[i];
			if (typeof rule[0] == 'string') {
				if (name == rule[0]) {
					return rule[1];
				}
			} else {
				if (rule[0].test(name)) {
					return name.replace(rule[0], rule[1]);
				}
			}
		}
		return name;
	};
	
	Crude._capitalize = function(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};
	
	Crude._extend = function(dest) {
		var sources = Array.prototype.slice.call(arguments, 1);
		for (var j = 0, len = sources.length, src; j < len; j++) {
			src = sources[j] || {};
			for (var i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	};
	
	Crude._wrapKeys = function(props, name) {
		var obj = {};
		for (var i in props) {
			if (props.hasOwnProperty(i)) {
				obj[name + '[' + i + ']'] = props[i];
			}
		}
		return obj;
	};
	
	Crude._inherit = function(Child, Parent) {
		function F() {}
		F.prototype = Parent.prototype;
		
		var proto = new F();
		proto.constructor = Child;
		Child.prototype = proto;
	};
	
}(this));