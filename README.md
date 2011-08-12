Crude is a simple JavaScript library for creating human-readable APIs to RESTful services, inspired by the Rails Routing API.

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