const JsonApiView = require('adonis-jsonapi/src/JsonApiView');

class Post extends JsonApiView {
  get attributes() {
    return ['title'];
  }

  user() {
    return this.belongsTo('App/Http/JsonApiViews/User', {
      included: true,
      excludeRelation: 'posts'
    });
  }

}

module.exports = Post;
