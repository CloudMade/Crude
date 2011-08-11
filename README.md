Crude is a simple JavaScript library for creating human-readable APIs to RESTful services, inspired by the Rails Routing API.

## Example usage

### Defining the API

```javascript
var MyApi = Crude.api('', 'js', function(url, method, data) {
	// do requests with jQuery as example
	return $.ajax({url: url, type: method, data: data});
});

MyApi.resource('post');
MyApi.resource('comment').parent(MyApi.posts);
MyApi.postComments.action('add', 'put');
```

### Using the API

```javascript
MyApi.posts.get(56).success(showPost);
// GET /posts/56.json, call showPost on response

MyApi.posts.get({orderBy: 'date'});
// GET /posts.json?order_by=date

MyApi.comments.inPost(123).create({author: 'Vladimir', message: 'Hi!'});
// POST /posts/123/comments.json, comment[author]=Vladimir&comment[message]=Hi!

MyApi.comments.inPost(123).add(345).error(handleError);
// PUT /posts/123/comments/345/add.json, call showError if not successful

MyApi.request('some/{foo}/url', 'get', {foo: 'custom', baz: 5});
// GET /some/custom/url.json?baz=5
```