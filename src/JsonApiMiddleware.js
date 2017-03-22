'use strict';

// const JsonApiSerializer = require('jsonapi-serializer').Serializer;
const { JsonApiRequest, JsonApiError, ValidationError } = require('./JsonApiRequest');

function setupSerializer(use) {
  return function (serializerName, data, request) {
    const helpers = use('Helpers');

    const View = use(helpers.makeNameSpace('Http/JsonApiViews', serializerName));
    const view = new View(use);

    return view.build(data, request);
  };
}

class JsonApi {

  constructor(use) {
    this.use = use;
    const serializer = setupSerializer(use);
    this.serializer = serializer;
    const Response = use('Adonis/Src/Response');

    Response.macro('serializePayload', serializer);

    Response.macro('isJsonApiError', err => err instanceof JsonApiError);
    Response.macro('isValidationError', err => err instanceof ValidationError);
    Response.macro('jsonApiError', function (err) {
      if (err instanceof ValidationError) {
        this.status(err.status).json({ errors: err.makeErrors() });
      } else if (err instanceof JsonApiError) {
        this.status(err.status).json({ errors: [err.message] });
      } else {
        this.status(err.status).json({ errors: [{
          status: err.status,
          title: err.name,
          detail: err.message,
        }] });
      }
    });
  }

  * handle(request, response, next) {
    request.jsonApi = new JsonApiRequest(request);
    response.jsonApi = (serializerName, data, statusCode = 200)  => {
      this.serializer(serializerName, data, request).then((json) => {
        response.status(statusCode).json(json);
      });
    };

    yield next;
  }

}

module.exports = JsonApi;
