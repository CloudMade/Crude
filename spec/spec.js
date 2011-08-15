
describe("Crude", function() {
	var api;

	beforeEach(function() {
		api = Crude.api('http://example.com', 'js', function(url, method, data) {
			return {url: url, method: method, data: data};
		});
	});

	describe('request', function() {
		it('should use the config passed in the Crude.api function correctly', function() {
			var data = {foo: 'bar'},
				result = api.request('test', 'put', data);

			expect(result.url).toEqual('http://example.com/test.js');
			expect(result.method).toEqual('put');
			expect(result.data).toEqual(data);
		});

		it('should work with two arguments, using "get" as the default method', function() {
			var data = {foo: 'bar'},
				result = api.request('test', data);

			expect(result.method).toEqual('get');
			expect(result.data).toEqual(data);
		});

		it('should evaluate each {prop} in the url with corresponding property from the data, also removing the prop from the latter', function() {
			var data = {
				foo: 1,
				bar: 2,
				baz: 3
			};

			var result = api.request('test/{foo}/bla/{baz}', data);

			expect(result.url).toEqual('http://example.com/test/1/bla/3.js');
			expect(result.data).toEqual({bar: 2});
		});
		
		it('should add data set through api.data(data) to requests globally', function() {
			api.data({apikey: 'qwerty'});

			var data = {foo: 'bar'},
				result = api.request('test', data);

			expect(result.data).toEqual({foo: 'bar', apikey: 'qwerty'});
		});
	});

	describe('resources', function() {
		var data = {foo: 'bar'};

		beforeEach(function() {
			api.resources('post');
		});

		it('should create a correct pluralized property in the api from resource name', function() {
			expect(api.posts).toBeDefined();

			api.resources('kitty');
			expect(api.kitties).toBeDefined();

			api.resources('wolf');
			expect(api.wolves).toBeDefined();

			api.resources('badass');
			expect(api.badasses).toBeDefined();

			api.resources('child');
			expect(api.children).toBeDefined();
		});

		it('should have get() working correctly', function() {
			var result = api.posts.get(data);

			expect(result.url).toEqual('http://example.com/posts.js');
			expect(result.method).toEqual('get');
			expect(result.data).toEqual(data);
		});

		it('should have get(id) working correctly', function() {
			var result = api.posts.get(1, data);

			expect(result.url).toEqual('http://example.com/posts/1.js');
			expect(result.method).toEqual('get');
			expect(result.data).toEqual(data);
		});

		it('should have create(props) working correctly', function() {
			var props = {prop: 5},
				result = api.posts.create(props, data);

			expect(result.url).toEqual('http://example.com/posts.js');
			expect(result.method).toEqual('post');
			expect(result.data).toEqual({
				'post[prop]': 5,
				foo: 'bar'
			});
		});

		it('should have update(id, props) working correctly', function() {
			var props = {prop: 5},
				result = api.posts.update(1, props, data);

			expect(result.url).toEqual('http://example.com/posts/1.js');
			expect(result.method).toEqual('put');
			expect(result.data).toEqual({
				'post[prop]': 5,
				foo: 'bar'
			});
		});

		it('should have del(id) working correctly', function() {
			var result = api.posts.del(1, data);

			expect(result.url).toEqual('http://example.com/posts/1.js');
			expect(result.method).toEqual('delete');
			expect(result.data).toEqual(data);
		});

		it('memberAction(name, opts) should create corresponding method properly', function() {
			api.posts.memberAction('custom');

			var result = api.posts.custom(1, data);

			expect(result.url).toEqual('http://example.com/posts/1/custom.js');
			expect(result.method).toEqual('get');
			expect(result.data).toEqual(data);
		});

		it('memberAction options should work properly', function() {
			function argsToData(ids) {
				return {ids: ids.join(',')};
			}

			api.posts.memberAction('custom', {
				method: 'put',
				path: 'foo/bar',
				argsToData: argsToData
			});

			var result = api.posts.custom(1, [1, 2, 3]);

			expect(result.url).toEqual('http://example.com/posts/1/foo/bar.js');
			expect(result.method).toEqual('put');
			expect(result.data).toEqual({ids: '1,2,3'});
		});

		it('collectionAction(name, opts) should create corresponding method properly', function() {
			api.posts.collectionAction('custom');

			var result = api.posts.custom(data);

			expect(result.url).toEqual('http://example.com/posts/custom.js');
			expect(result.method).toEqual('get');
			expect(result.data).toEqual(data);
		});

		it('collectionAction options should work properly', function() {
			function argsToData(ids) {
				return {ids: ids.join(',')};
			}

			api.posts.collectionAction('custom', {
				method: 'put',
				path: 'foo/bar',
				argsToData: argsToData
			});

			var result = api.posts.custom([1, 2, 3]);

			expect(result.url).toEqual('http://example.com/posts/foo/bar.js');
			expect(result.method).toEqual('put');
			expect(result.data).toEqual({ids: '1,2,3'});
		});

		describe('child resources', function() {
			beforeEach(function() {
				api.resources('comment').belongTo(api.posts);
			});

			it('should create proper api.resources.in<Parent> accessor', function() {
				expect(api.comments.inPost).toBeDefined();
			});

			it('should create child resources prototype accessor through api.<parent><Children>', function() {
				var postComments = api.comments.inPost(2),
					postCommentsProto = postComments.constructor.prototype,
					resourcesConstructor = api.comments.constructor,
					resourcesProto = resourcesConstructor.prototype;

				expect(api.postComments).toBe(postCommentsProto);
				expect(postCommentsProto).not.toBe(resourcesProto);
				expect(postComments instanceof resourcesConstructor).toBeTruthy();
			});

			it('should have get() working correctly', function() {
				var result = api.comments.inPost(2).get();
				expect(result.url).toEqual('http://example.com/posts/2/comments.js');
			});

			it('should have get(id) working correctly', function() {
				var result = api.comments.inPost(2).get(1);
				expect(result.url).toEqual('http://example.com/posts/2/comments/1.js');
			});

			it('memberAction on particular nested resources through api.<parent><Children> should work correctly', function() {
				api.postComments.memberAction('foo');

				var result = api.comments.inPost(1).foo(2, data);

				expect(result.url).toEqual('http://example.com/posts/1/comments/2/foo.js');
				expect(result.method).toEqual('get');
				expect(result.data).toEqual(data);
			});

			it('api-wide memberAction on nested resources through api.nestedResources should work correctly', function() {
				api.nestedResources.memberAction('bar');

				var result = api.comments.inPost(1).bar(2, data);

				expect(result.url).toEqual('http://example.com/posts/1/comments/2/bar.js');
				expect(result.method).toEqual('get');
				expect(result.data).toEqual(data);
			});
		});
	});
});