const JsonApiView = require('../../../src/JsonApiView');

class User extends JsonApiView {
  get attributes() {
    return ['email', 'username'];
  }

  get relations() {
    return {
      posts: {
        strategy: 'embed',
      },
    };
  }

  posts() {
    return this.hasMany('App/Http/JsonApiViews/Post', {
      included: true,
      excludeRelation: 'user',
    });
  }

}

module.exports = User;
