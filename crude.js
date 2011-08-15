/**
 * @preserve Copyright (c) 2011, Vladimir Agafonkin, CloudMade
 * Crude (v0.1) is a clever JavaScript library for working with RESTful services.
 * See https://github.com/CloudMade/Crude for more information.
 */

/*jslint regexp: true, browser: true, node: true */

(function (global) {
	"use strict";

	var Crude = {version: '0.1'},
	    oldCrude = global.Crude;

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = Crude;
	} else {
		global.Crude = Crude;
	}

	// restores the original global Crude property
	Crude.noConflict = function () {
		global.Crude = oldCrude;
		return this;
	};


	Crude.api = function (baseUrl, format, requestFn) {
		return new Crude.Api(baseUrl, format, requestFn);
	};


	// the root class of the API (handles basic configuration)

	Crude.Api = function (baseUrl, format, requestFn) {
		this.baseUrl = baseUrl;
		this.format = format;
		this.requestFn = requestFn;

		// create a Resources-inherited class to allow extending nested resources api-wide
		this.NestedResources = function () {
			Crude.Resources.apply(this, arguments);
		};
		Crude.inherit(this.NestedResources, Crude.Resources);

		this.nestedResources = this.NestedResources.prototype;
	};

	Crude.Api.prototype = {
		request: function (path, method, data) {
			// (path, data) signature
			if (!data && typeof method !== 'string') {
				data = method;
				method = 'get';
			}

			data = data || {};

			var url = this.baseUrl + '/' + path + '.' + this.format;

			// evaluate {stuff} in the url
			url = Crude.template(url, data, true);

			return this.requestFn(url, method, data);
		},

		// example: api.resources('post') creates Crude.Resources instance as api.posts
		resources: function (name, pluralName) {
			pluralName = pluralName || Crude.pluralize(name);
			var resources = this[pluralName] = new Crude.Resources(this, name, pluralName);
			return resources;
		}
	};


	// the class where most of the magic happens (all the RESTful stuff)

	Crude.Resources = function (api, name, pluralName, prefix) {
		this.api = api;
		this.name = name;
		this.pluralName = pluralName;
		this.prefix = prefix;
	};

	Crude.Resources.prototype = {
		request: function (path, method, data) {
			var prefix = (this.prefix ? this.prefix + '/' : ''),
			    postfix = (path ? '/' + path : '');

			return this.api.request(prefix + this.pluralName + postfix, method, data);
		},

		get: function (id, data) {
			// get(data) signature
			if (!data && typeof id === 'object') {
				data = id;
				id = null;
			}

			return this.request(id || '', 'get', data);
		},

		create: function (props, data) {
			props = Crude.wrapKeys(props, this.name);
			data = Crude.extend({}, data, props);

			return this.request('', 'post', data);
		},

		update: function (id, props, data) {
			props = Crude.wrapKeys(props, this.name);
			data = Crude.extend({}, data, props);

			return this.request(id, 'put', data);
		},

		del: function (id, data) {
			return this.request(id, 'delete', data);
		},

		// e.g. after api.comments.belongTo(api.posts),
		// api.comments.inPost(id) returns NestedResources instance
		belongTo: function (parent) {
			var methodName = 'in' + Crude.capitalize(parent.name),
				ApiNestedResources = this.api.NestedResources,
				protoAccessName = parent.name + Crude.capitalize(this.pluralName);

			// created a separate inherited class to allow extending this resource pair
			function NestedResources() {
				ApiNestedResources.apply(this, arguments);
			}
			Crude.inherit(NestedResources, ApiNestedResources);

			// e.g. allow prototype access through api.postComments
			this.api[protoAccessName] = NestedResources.prototype;

			this[methodName] = function (id) {
				var prefix = parent.pluralName + '/' + id;
				return new NestedResources(this.api, this.name, this.pluralName, prefix);
			};
			return this;
		},

		// for custom actions on collections, e.g. /posts/delete_all
		collectionAction: function (name, options) {
			options = Crude.extend({
				method: 'get',
				path: name
			}, options);

			this[name] = function (data) {
				if (options.argsToData) {
					data = options.argsToData.apply(null, arguments);
				}
				return this.request(options.path, options.method, data);
			};

			return this;
		},

		// for custom actions on members, e.g. /posts/1/voteup
		// TODO remove repetition with collectionAction
		memberAction: function (name, options) {
			options = Crude.extend({
				method: 'get',
				path: name
			}, options);

			this[name] = function (id, data) {
				if (options.argsToData) {
					var args = Array.prototype.slice.call(arguments, 1);
					data = options.argsToData.apply(null, args);
				}
				return this.request(id + '/' + options.path, options.method, data);
			};

			return this;
		}
	};


	// various utility functions

	// classical inheritance for internal use
	Crude.inherit = function (Child, Parent) {
		function F() {}
		F.prototype = Parent.prototype;

		var proto = new F();
		proto.constructor = Child;
		Child.prototype = proto;
	};

	// feel free to add more rules from outside
	Crude.pluralRules = [[/$/, 's'],
	                     [/s$/i, 's'],
	                     [/(?:([^f])fe|([lr])f)$/i, '$1$2ves'],
	                     [/([^aeiouy]|qu)y$/i, '$1ies'],
	                     [/(x|ch|s|sh)$/i, '$1es'],
	                     ['child', 'children']];

	Crude.pluralize = function (name) {
		var rules = Crude.pluralRules,
		    i = rules.length,
		    rule;

		while (i) {
			i -= 1; // conforming to strict JSLint for fun :)
			rule = rules[i];
			if (typeof rule[0] === 'string') {
				if (name === rule[0]) {
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

	Crude.capitalize = function (str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	Crude.extend = function (dest) {
		var sources = Array.prototype.slice.call(arguments, 1),
		    len = sources.length,
		    src,
		    i,
		    j;

		for (j = 0; j < len; j += 1) {
			src = sources[j] || {};
			for (i in src) {
				if (src.hasOwnProperty(i)) {
					dest[i] = src[i];
				}
			}
		}
		return dest;
	};

	// turns {foo: 'bar'} into {'property[foo]': 'bar'}
	Crude.wrapKeys = function (props, name) {
		var obj = {}, i;
		for (i in props) {
			if (props.hasOwnProperty(i)) {
				obj[name + '[' + i + ']'] = props[i];
			}
		}
		return obj;
	};

	// Crude.template("Hello {foo}", {foo: "World"}) -> "Hello world"
	Crude.template = function (str, data, cleanupData) {
		return str.replace(/\{ *([^} ]+) *\}/g, function (str, key) {
			var value = data[key];
			if (!data.hasOwnProperty(key)) {
				throw new Error('No value provided for variable ' + str);
			}
			if (cleanupData) {
				delete data[key];
			}
			return value;
		});
	};

}(this));
