const i = require('inflect');
const pick = require('lodash.pick');
const unionBy = require('lodash.unionby');
const _ = require('lodash');
const Lucid = require('adonis-lucid/src/Lucid/Model');

class JsonApiRelation {
  constructor(serializer, { included = false, excludeRelation }) {
    this.serializer = serializer;
    this.included = included;
    this.excludeRelation = excludeRelation;
  }

  build(use) {
    const serializer = new (use(this.serializer))(use);

    if (this.included) {
      return Object.assign({}, { ref: 'id', included: this.included },
        serializer.build({ excludeRelation: this.excludeRelation }));
    }

    return { ref: 'id', included: this.included, type: serializer.type };
  }
}

class JsonApiView {
  constructor(use) {
    this.use = use;
  }

  get type() {
    return i.dasherize(i.underscore(this.constructor.name));
  }

  get loadedData() {
    return [].concat(this.attributes, this.getRelations());
  }

  get attributes() {
    return [];
  }

  unwrap(relationData) {
    if (relationData instanceof Lucid) {
      return relationData.toJSON();
    } else if (typeof relationData.map === 'function') {
      return _(relationData).map(r => this.unwrap(r)).value();
    }

    return relationData;
  }

  async loadRelation(model, relationName) {
    if (model[relationName] && typeof model[relationName] !== 'function') {
      return model[relationName];
    }

    if (model.relations[relationName]) {
      return this.unwrap(model.relations[relationName]);
    }

    await model.related(relationName).load();

    return this.unwrap(model.relations[relationName]);
  }

  hasMany(serializer, options) {
    return new JsonApiRelation(serializer, options);
  }

  belongsTo(serializer, options) {
    return new JsonApiRelation(serializer, options);
  }


  get relations() {
    return {};
  }

  async build(data, request) {
    const attributes = pick(data.toJSON(), this.attributes);

    const requestedRelations = request.get().include ?
      request.get().include.split(',') : [];

    const loadedRelations = Object.keys(data.relations || {});

    const eagerLoadedRelations = Object.keys(this.relations)
      .filter(key => this.relations[key].strategy === 'embed');

    const allRelations = unionBy(requestedRelations, loadedRelations, eagerLoadedRelations);

    const relationData = await Promise.all(
      allRelations.map(relationName => this.loadRelation(data, relationName)));

    const relations = allRelations.reduce((obj, key, index) => {
      obj[key] = relationData[index];

      return obj;
    }, {});

    return {
      data: {
        id: data.id,
        attributes,
        relationships: _.mapValues(relations, v => v.map(o => ({ id: o.id, type: 'post' }))),
      },
    };
  }
}

module.exports = JsonApiView;
