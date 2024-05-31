/*--------------------------------------
 *
 * Copyright 2024 AffinitiQuest.io
 *
 *---------------------------------------*/
import {
  HttpResponse,
  HttpResponseBadRequest,
  HttpResponseConflict,
  HttpResponseCreated,
  HttpResponseForbidden,
  HttpResponseInternalServerError,
  HttpResponseMethodNotAllowed,
  HttpResponseNoContent,
  HttpResponseNotFound,
  HttpResponseNotImplemented,
  HttpResponseOK,
  HttpResponseTooManyRequests,
  HttpResponseUnauthorized
} from '@foal/core';

export function createHttpResponseObject(statusCode: number, data?: any): HttpResponse {
  switch (statusCode) {
    case 200: {
      return new HttpResponseOK(data);
    }
    case 201: {
      return new HttpResponseCreated(data);
    }
    case 204: {
      return new HttpResponseNoContent();
    }
    case 400: {
      return new HttpResponseBadRequest(data);
    }
    case 401: {
      return new HttpResponseUnauthorized(data);
    }
    case 403: {
      return new HttpResponseForbidden(data);
    }
    case 404: {
      return new HttpResponseNotFound(data);
    }
    case 405: {
      return new HttpResponseMethodNotAllowed(data);
    }
    case 409: {
      return new HttpResponseConflict(data);
    }
    case 429: {
      return new HttpResponseTooManyRequests(data);
    }
    case 501: {
      return new HttpResponseNotImplemented(data);
    }
    default: {
      return new HttpResponseInternalServerError(data);
    }
  }
}
