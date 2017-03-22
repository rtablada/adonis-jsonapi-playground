const JsonApiView = require('../../../src/JsonApiView');

class User extends JsonApiView {
  get attributes() {
    return ['email', 'username'];
  }

  posts() {
    return this.hasMany('App/Http/JsonApiViews/Post', {
      included: true,
      excludeRelation: 'user',
    });
  }

}

module.exports = User;
