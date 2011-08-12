## Crude

Crude is a clever JavaScript library from [CloudMade](http://cloudmade.com) that allows you to create human-readable APIs to RESTful services, inspired by the Rails routing engine.

Initially a part of a closed-source client code for an upcoming CloudMade service, it's now released under an open source BSD-type license. It's designed to work both as a browser library and a CommonJS module for server-side platforms like Node.js. It also has a complete Jasmine-powered test coverage.

## Basic usage example

### Defining the API

```javascript
var myApi = Crude.api('', 'js', function(url, method, data) {
	// do requests with jQuery as example
	return $.ajax({url: url, type: method, data: data});
});

// this is where the magic happens
myApi.resources('post');
myApi.resources('comment').belongTo(MyApi.posts);
myApi.postComments.memberAction('add', {method: 'put'});
```

### Using the API

```javascript
myApi.posts.get(56).success(showPost);
// GET /posts/56.json, call showPost on response

myApi.posts.get({order: 'date'});
// GET /posts.json?order=date

myApi.comments.inPost(123).create({author: 'Vladimir', message: 'Hi!'});
// POST /posts/123/comments.json, comment[author]=Vladimir&comment[message]=Hi!

myApi.comments.inPost(123).add(345).error(handleError);
// PUT /posts/123/comments/345/add.json, call showError if not successful

myApi.request('some/{foo}/url', 'get', {foo: 'custom', baz: 5});
// GET /some/custom/url.json?baz=5
```