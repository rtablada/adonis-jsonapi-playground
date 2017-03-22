const JsonApiView = require('../../../src/JsonApiView');

class Post extends JsonApiView {
  get attributes() {
    return ['title'];
  }

  get relations() {
    return {
      user: {
        strategy: 'embed',
      },
    };
  }

  user() {
    return this.belongsTo('App/Http/JsonApiViews/User');
  }

}

module.exports = Post;
