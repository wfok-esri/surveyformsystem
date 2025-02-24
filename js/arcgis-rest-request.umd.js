/* @preserve
* @esri/arcgis-rest-request - v4.0.0-beta.7 - Apache-2.0
* Copyright (c) 2017-2022 Esri, Inc.
* Mon Apr 18 2022 16:41:57 GMT+0000 (Coordinated Universal Time)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.arcgisRest = global.arcgisRest || {}));
})(this, (function (exports) { 'use strict';

  /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Checks parameters to see if we should use FormData to send the request
   * @param params The object whose keys will be encoded.
   * @return A boolean indicating if FormData will be required.
   */
  function requiresFormData(params) {
      return Object.keys(params).some(key => {
          let value = params[key];
          if (!value) {
              return false;
          }
          if (value && value.toParam) {
              value = value.toParam();
          }
          const type = value.constructor.name;
          switch (type) {
              case "Array":
                  return false;
              case "Object":
                  return false;
              case "Date":
                  return false;
              case "Function":
                  return false;
              case "Boolean":
                  return false;
              case "String":
                  return false;
              case "Number":
                  return false;
              default:
                  return true;
          }
      });
  }
  /**
   * Converts parameters to the proper representation to send to the ArcGIS REST API.
   * @param params The object whose keys will be encoded.
   * @return A new object with properly encoded values.
   */
  function processParams(params) {
      const newParams = {};
      Object.keys(params).forEach(key => {
          var _a, _b;
          let param = params[key];
          if (param && param.toParam) {
              param = param.toParam();
          }
          if (!param &&
              param !== 0 &&
              typeof param !== "boolean" &&
              typeof param !== "string") {
              return;
          }
          const type = param.constructor.name;
          let value;
          // properly encodes objects, arrays and dates for arcgis.com and other services.
          // ported from https://github.com/Esri/esri-leaflet/blob/master/src/Request.js#L22-L30
          // also see https://github.com/Esri/arcgis-rest-js/issues/18:
          // null, undefined, function are excluded. If you want to send an empty key you need to send an empty string "".
          switch (type) {
              case "Array":
                  // Based on the first element of the array, classify array as an array of arrays, an array of objects
                  // to be stringified, or an array of non-objects to be comma-separated
                  // eslint-disable-next-line no-case-declarations
                  const firstElementType = (_b = (_a = param[0]) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name;
                  value =
                      firstElementType === "Array" ? param : // pass thru array of arrays
                          firstElementType === "Object" ? JSON.stringify(param) : // stringify array of objects
                              param.join(","); // join other types of array elements
                  break;
              case "Object":
                  value = JSON.stringify(param);
                  break;
              case "Date":
                  value = param.valueOf();
                  break;
              case "Function":
                  value = null;
                  break;
              case "Boolean":
                  value = param + "";
                  break;
              default:
                  value = param;
                  break;
          }
          if (value || value === 0 || typeof value === "string" || Array.isArray(value)) {
              newParams[key] = value;
          }
      });
      return newParams;
  }

  /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Encodes keys and parameters for use in a URL's query string.
   *
   * @param key Parameter's key
   * @param value Parameter's value
   * @returns Query string with key and value pairs separated by "&"
   */
  function encodeParam(key, value) {
      // For array of arrays, repeat key=value for each element of containing array
      if (Array.isArray(value) && value[0] && Array.isArray(value[0])) {
          return value
              .map((arrayElem) => encodeParam(key, arrayElem))
              .join("&");
      }
      return encodeURIComponent(key) + "=" + encodeURIComponent(value);
  }
  /**
   * Encodes the passed object as a query string.
   *
   * @param params An object to be encoded.
   * @returns An encoded query string.
   */
  function encodeQueryString(params) {
      const newParams = processParams(params);
      return Object.keys(newParams)
          .map((key) => {
          return encodeParam(key, newParams[key]);
      })
          .join("&");
  }

  const FormData = globalThis.FormData;
  const File = globalThis.File;
  const Blob$1 = globalThis.Blob;

  /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Encodes parameters in a [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object in browsers or in a [FormData](https://github.com/form-data/form-data) in Node.js
   *
   * @param params An object to be encoded.
   * @returns The complete [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object.
   */
  function encodeFormData(params, forceFormData) {
      // see https://github.com/Esri/arcgis-rest-js/issues/499 for more info.
      const useFormData = requiresFormData(params) || forceFormData;
      const newParams = processParams(params);
      if (useFormData) {
          const formData = new FormData();
          Object.keys(newParams).forEach((key) => {
              if (typeof Blob !== "undefined" && newParams[key] instanceof Blob) {
                  /* To name the Blob:
                   1. look to an alternate request parameter called 'fileName'
                   2. see if 'name' has been tacked onto the Blob manually
                   3. if all else fails, use the request parameter
                  */
                  const filename = newParams["fileName"] || newParams[key].name || key;
                  formData.append(key, newParams[key], filename);
              }
              else {
                  formData.append(key, newParams[key]);
              }
          });
          return formData;
      }
      else {
          return encodeQueryString(params);
      }
  }

  /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * This represents a generic error from an ArcGIS endpoint. There will be details about the error in the {@linkcode ArcGISRequestError.message},  {@linkcode ArcGISRequestError.originalMessage} properties on the error. You
   * can also access the original server response at  {@linkcode ArcGISRequestError.response} which may have additional details.
   *
   * ```js
   * request(someUrl, someOptions).catch(e => {
   *   if(e.name === "ArcGISRequestError") {
   *     console.log("Something went wrong with the request:", e);
   *     console.log("Full server response", e.response);
   *   }
   * })
   * ```
   */
  class ArcGISRequestError extends Error {
      /**
       * Create a new `ArcGISRequestError`  object.
       *
       * @param message - The error message from the API
       * @param code - The error code from the API
       * @param response - The original response from the API that caused the error
       * @param url - The original url of the request
       * @param options - The original options and parameters of the request
       */
      constructor(message, code, response, url, options) {
          // 'Error' breaks prototype chain here
          super(message);
          // restore prototype chain, see https://stackoverflow.com/questions/41102060/typescript-extending-error-class
          // we don't need to check for Object.setPrototypeOf as in the answers because we are ES2017 now.
          // Also see https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
          // and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types
          const actualProto = new.target.prototype;
          Object.setPrototypeOf(this, actualProto);
          message = message || "UNKNOWN_ERROR";
          code = code || "UNKNOWN_ERROR_CODE";
          this.name = "ArcGISRequestError";
          this.message =
              code === "UNKNOWN_ERROR_CODE" ? message : `${code}: ${message}`;
          this.originalMessage = message;
          this.code = code;
          this.response = response;
          this.url = url;
          this.options = options;
      }
  }

  /* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Method used internally to surface messages to developers.
   */
  function warn(message) {
      if (console && console.warn) {
          console.warn.apply(console, [message]);
      }
  }

  function getFetch() {
    return Promise.resolve({
      fetch: globalThis.fetch,
      Headers: globalThis.Headers,
      Response: globalThis.Response,
      Request: globalThis.Request
    });
  }

  /* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  const NODEJS_DEFAULT_REFERER_HEADER = `@esri/arcgis-rest-js`;
  /**
   * Sets the default options that will be passed in **all requests across all `@esri/arcgis-rest-js` modules**.
   *
   * ```js
   * import { setDefaultRequestOptions } from "@esri/arcgis-rest-request";
   *
   * setDefaultRequestOptions({
   *   authentication: ArcGISIdentityManager // all requests will use this session by default
   * })
   * ```
   *
   * You should **never** set a default `authentication` when you are in a server side environment where you may be handling requests for many different authenticated users.
   *
   * @param options The default options to pass with every request. Existing default will be overwritten.
   * @param hideWarnings Silence warnings about setting default `authentication` in shared environments.
   */
  function setDefaultRequestOptions(options, hideWarnings) {
      if (options.authentication && !hideWarnings) {
          warn("You should not set `authentication` as a default in a shared environment such as a web server which will process multiple users requests. You can call `setDefaultRequestOptions` with `true` as a second argument to disable this warning.");
      }
      globalThis.DEFAULT_ARCGIS_REQUEST_OPTIONS = options;
  }
  function getDefaultRequestOptions() {
      return (globalThis.DEFAULT_ARCGIS_REQUEST_OPTIONS || {
          httpMethod: "POST",
          params: {
              f: "json"
          }
      });
  }
  /**
   * This error is thrown when a request encounters an invalid token error. Requests that use {@linkcode ArcGISIdentityManager} or
   * {@linkcode ApplicationCredentialsManager} in the `authentication` option the authentication manager will automatically try to generate
   * a fresh token using either {@linkcode ArcGISIdentityManager.refreshCredentials} or
   * {@linkcode ApplicationCredentialsManager.refreshCredentials}. If the request with the new token fails you will receive an `ArcGISAuthError`
   * if refreshing the token fails you will receive an instance of {@linkcode ArcGISTokenRequestError}.
   *
   * ```js
   * request(someUrl, {
   *   authentication: identityManager,
   *   // some additional options...
   * }).catch(e => {
   *   if(e.name === "ArcGISAuthError") {
   *     console.log("Request with a new token failed you might want to have the user authorize again.")
   *   }
   *
   *   if(e.name === "ArcGISTokenRequestError") {
   *     console.log("There was an error refreshing the token you might want to have the user authorize again.")
   *   }
   * })
   * ```
   */
  class ArcGISAuthError extends ArcGISRequestError {
      /**
       * Create a new `ArcGISAuthError`  object.
       *
       * @param message - The error message from the API
       * @param code - The error code from the API
       * @param response - The original response from the API that caused the error
       * @param url - The original url of the request
       * @param options - The original options of the request
       */
      constructor(message = "AUTHENTICATION_ERROR", code = "AUTHENTICATION_ERROR_CODE", response, url, options) {
          super(message, code, response, url, options);
          this.name = "ArcGISAuthError";
          this.message =
              code === "AUTHENTICATION_ERROR_CODE" ? message : `${code}: ${message}`;
          // restore prototype chain, see https://stackoverflow.com/questions/41102060/typescript-extending-error-class
          // we don't need to check for Object.setPrototypeOf as in the answers because we are ES2017 now.
          // Also see https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
          // and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types
          const actualProto = new.target.prototype;
          Object.setPrototypeOf(this, actualProto);
      }
      retry(getSession, retryLimit = 1) {
          let tries = 0;
          const retryRequest = (resolve, reject) => {
              tries = tries + 1;
              getSession(this.url, this.options)
                  .then((session) => {
                  const newOptions = Object.assign(Object.assign({}, this.options), { authentication: session });
                  return internalRequest(this.url, newOptions);
              })
                  .then((response) => {
                  resolve(response);
              })
                  .catch((e) => {
                  if (e.name === "ArcGISAuthError" && tries < retryLimit) {
                      retryRequest(resolve, reject);
                  }
                  else if (e.name === this.name &&
                      e.message === this.message &&
                      tries >= retryLimit) {
                      reject(this);
                  }
                  else {
                      reject(e);
                  }
              });
          };
          return new Promise((resolve, reject) => {
              retryRequest(resolve, reject);
          });
      }
  }
  /**
   * Checks for errors in a JSON response from the ArcGIS REST API. If there are no errors, it will return the `data` passed in. If there is an error, it will throw an `ArcGISRequestError` or `ArcGISAuthError`.
   *
   * @param data The response JSON to check for errors.
   * @param url The url of the original request
   * @param params The parameters of the original request
   * @param options The options of the original request
   * @returns The data that was passed in the `data` parameter
   */
  function checkForErrors(response, url, params, options, originalAuthError) {
      // this is an error message from billing.arcgis.com backend
      if (response.code >= 400) {
          const { message, code } = response;
          throw new ArcGISRequestError(message, code, response, url, options);
      }
      // error from ArcGIS Online or an ArcGIS Portal or server instance.
      if (response.error) {
          const { message, code, messageCode } = response.error;
          const errorCode = messageCode || code || "UNKNOWN_ERROR_CODE";
          if (code === 498 || code === 499) {
              if (originalAuthError) {
                  throw originalAuthError;
              }
              else {
                  throw new ArcGISAuthError(message, errorCode, response, url, options);
              }
          }
          throw new ArcGISRequestError(message, errorCode, response, url, options);
      }
      // error from a status check
      if (response.status === "failed" || response.status === "failure") {
          let message;
          let code = "UNKNOWN_ERROR_CODE";
          try {
              message = JSON.parse(response.statusMessage).message;
              code = JSON.parse(response.statusMessage).code;
          }
          catch (e) {
              message = response.statusMessage || response.message;
          }
          throw new ArcGISRequestError(message, code, response, url, options);
      }
      return response;
  }
  /**
   * This is the internal implementation of `request` without the automatic retry behavior to prevent
   * infinite loops when a server continues to return invalid token errors.
   *
   * @param url - The URL of the ArcGIS REST API endpoint.
   * @param requestOptions - Options for the request, including parameters relevant to the endpoint.
   * @returns A Promise that will resolve with the data from the response.
   * @internal
   */
  function internalRequest(url, requestOptions) {
      const defaults = getDefaultRequestOptions();
      const options = Object.assign(Object.assign(Object.assign({ httpMethod: "POST" }, defaults), requestOptions), {
          params: Object.assign(Object.assign({}, defaults.params), requestOptions.params),
          headers: Object.assign(Object.assign({}, defaults.headers), requestOptions.headers)
      });
      const { httpMethod, rawResponse } = options;
      const params = Object.assign({ f: "json" }, options.params);
      let originalAuthError = null;
      const fetchOptions = {
          method: httpMethod,
          signal: options.signal,
          /* ensures behavior mimics XMLHttpRequest.
          needed to support sending IWA cookies */
          credentials: options.credentials || "same-origin"
      };
      // the /oauth2/platformSelf route will add X-Esri-Auth-Client-Id header
      // and that request needs to send cookies cross domain
      // so we need to set the credentials to "include"
      if (options.headers &&
          options.headers["X-Esri-Auth-Client-Id"] &&
          url.indexOf("/oauth2/platformSelf") > -1) {
          fetchOptions.credentials = "include";
      }
      let authentication;
      // Check to see if this is a raw token as a string and create a IAuthenticationManager like object for it.
      // Otherwise this just assumes that options.authentication is an IAuthenticationManager.
      if (typeof options.authentication === "string") {
          const rawToken = options.authentication;
          authentication = {
              portal: "https://www.arcgis.com/sharing/rest",
              getToken: () => {
                  return Promise.resolve(rawToken);
              }
          };
          /* istanbul ignore else - we don't need to test NOT warning people */
          if (!options.authentication.startsWith("AAPK") && // doesn't look like an API Key
              !options.suppressWarnings && // user doesn't want to suppress warnings for this request
              !globalThis.ARCGIS_REST_JS_SUPPRESS_TOKEN_WARNING // we havn't shown the user this warning yet
          ) {
              warn(`Using an oAuth 2.0 access token directly in the token option is discouraged. Consider using ArcGISIdentityManager or Application session. See https://esriurl.com/arcgis-rest-js-direct-token-warning for more information.`);
              globalThis.ARCGIS_REST_JS_SUPPRESS_TOKEN_WARNING = true;
          }
      }
      else {
          authentication = options.authentication;
      }
      // for errors in GET requests we want the URL passed to the error to be the URL before
      // query params are applied.
      const originalUrl = url;
      return (authentication
          ? authentication.getToken(url).catch((err) => {
              /**
               * append original request url and requestOptions
               * to the error thrown by getToken()
               * to assist with retrying
               */
              err.url = url;
              err.options = options;
              /**
               * if an attempt is made to talk to an unfederated server
               * first try the request anonymously. if a 'token required'
               * error is thrown, throw the UNFEDERATED error then.
               */
              originalAuthError = err;
              return Promise.resolve("");
          })
          : Promise.resolve(""))
          .then((token) => {
          if (token.length) {
              params.token = token;
          }
          if (authentication && authentication.getDomainCredentials) {
              fetchOptions.credentials = authentication.getDomainCredentials(url);
          }
          // Custom headers to add to request. IRequestOptions.headers with merge over requestHeaders.
          const requestHeaders = {};
          if (fetchOptions.method === "GET") {
              // Prevents token from being passed in query params when hideToken option is used.
              /* istanbul ignore if - window is always defined in a browser. Test case is covered by Jasmine in node test */
              if (params.token &&
                  options.hideToken &&
                  // Sharing API does not support preflight check required by modern browsers https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
                  typeof window === "undefined") {
                  requestHeaders["X-Esri-Authorization"] = `Bearer ${params.token}`;
                  delete params.token;
              }
              // encode the parameters into the query string
              const queryParams = encodeQueryString(params);
              // dont append a '?' unless parameters are actually present
              const urlWithQueryString = queryParams === "" ? url : url + "?" + encodeQueryString(params);
              if (
              // This would exceed the maximum length for URLs specified by the consumer and requires POST
              (options.maxUrlLength &&
                  urlWithQueryString.length > options.maxUrlLength) ||
                  // Or if the customer requires the token to be hidden and it has not already been hidden in the header (for browsers)
                  (params.token && options.hideToken)) {
                  // the consumer specified a maximum length for URLs
                  // and this would exceed it, so use post instead
                  fetchOptions.method = "POST";
                  // If the token was already added as a Auth header, add the token back to body with other params instead of header
                  if (token.length && options.hideToken) {
                      params.token = token;
                      // Remove existing header that was added before url query length was checked
                      delete requestHeaders["X-Esri-Authorization"];
                  }
              }
              else {
                  // just use GET
                  url = urlWithQueryString;
              }
          }
          /* updateResources currently requires FormData even when the input parameters dont warrant it.
      https://developers.arcgis.com/rest/users-groups-and-items/update-resources.htm
          see https://github.com/Esri/arcgis-rest-js/pull/500 for more info. */
          const forceFormData = new RegExp("/items/.+/updateResources").test(url);
          if (fetchOptions.method === "POST") {
              fetchOptions.body = encodeFormData(params, forceFormData);
          }
          // Mixin headers from request options
          fetchOptions.headers = Object.assign(Object.assign({}, requestHeaders), options.headers);
          // This should have the same conditional for Node JS as ArcGISIdentityManager.refreshWithUsernameAndPassword()
          // to ensure that generated tokens have the same referer when used in Node with a username and password.
          /* istanbul ignore next - karma reports coverage on browser tests only */
          if ((typeof window === "undefined" ||
              (window && typeof window.document === "undefined")) &&
              !fetchOptions.headers.referer) {
              fetchOptions.headers.referer = NODEJS_DEFAULT_REFERER_HEADER;
          }
          /* istanbul ignore else blob responses are difficult to make cross platform we will just have to trust the isomorphic fetch will do its job */
          if (!requiresFormData(params) && !forceFormData) {
              fetchOptions.headers["Content-Type"] =
                  "application/x-www-form-urlencoded";
          }
          /**
           * Check for a global fetch first and use it if available. This allows us to use the default
           * configuration of fetch-mock in tests.
           */
          /* istanbul ignore next coverage is based on browser code and we don't test for the absence of global fetch so we can skip the else here. */
          return globalThis.fetch
              ? globalThis.fetch(url, fetchOptions)
              : getFetch().then(({ fetch }) => {
                  return fetch(url, fetchOptions);
              });
      })
          .then((response) => {
          if (!response.ok) {
              // server responded w/ an actual error (404, 500, etc)
              const { status, statusText } = response;
              throw new ArcGISRequestError(statusText, `HTTP ${status}`, response, url, options);
          }
          if (rawResponse) {
              return response;
          }
          switch (params.f) {
              case "json":
                  return response.json();
              case "geojson":
                  return response.json();
              case "html":
                  return response.text();
              case "text":
                  return response.text();
              /* istanbul ignore next blob responses are difficult to make cross platform we will just have to trust that isomorphic fetch will do its job */
              default:
                  return response.blob();
          }
      })
          .then((data) => {
          if ((params.f === "json" || params.f === "geojson") && !rawResponse) {
              const response = checkForErrors(data, originalUrl, params, options, originalAuthError);
              if (originalAuthError) {
                  /* If the request was made to an unfederated service that
                  didn't require authentication, add the base url and a dummy token
                  to the list of trusted servers to avoid another federation check
                  in the event of a repeat request */
                  const truncatedUrl = url
                      .toLowerCase()
                      .split(/\/rest(\/admin)?\/services\//)[0];
                  options.authentication.federatedServers[truncatedUrl] = {
                      token: [],
                      // default to 24 hours
                      expires: new Date(Date.now() + 86400 * 1000)
                  };
                  originalAuthError = null;
              }
              return response;
          }
          else {
              return data;
          }
      });
  }
  /**
   * Generic method for making HTTP requests to ArcGIS REST API endpoints.
   *
   * ```js
   * import { request } from '@esri/arcgis-rest-request';
   *
   * request('https://www.arcgis.com/sharing/rest')
   *   .then(response) // response.currentVersion === 5.2
   *
   * request('https://www.arcgis.com/sharing/rest', {
   *   httpMethod: "GET"
   * })
   *
   * request('https://www.arcgis.com/sharing/rest/search', {
   *   params: { q: 'parks' }
   * })
   *   .then(response) // response.total => 78379
   * ```
   *
   * @param url - The URL of the ArcGIS REST API endpoint.
   * @param requestOptions - Options for the request, including parameters relevant to the endpoint.
   * @returns A Promise that will resolve with the data from the response.
   */
  function request(url, requestOptions = { params: { f: "json" } }) {
      return internalRequest(url, requestOptions).catch((e) => {
          if (e instanceof ArcGISAuthError &&
              requestOptions.authentication &&
              typeof requestOptions.authentication !== "string" &&
              requestOptions.authentication.canRefresh &&
              requestOptions.authentication.refreshCredentials) {
              return e.retry(() => {
                  return requestOptions.authentication.refreshCredentials();
              }, 1);
          }
          else {
              return Promise.reject(e);
          }
      });
  }

  /* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Helper for methods with lots of first order request options to pass through as request parameters.
   */
  function appendCustomParams(customOptions, keys, baseOptions) {
      const requestOptionsKeys = [
          "params",
          "httpMethod",
          "rawResponse",
          "authentication",
          "portal",
          "fetch",
          "maxUrlLength",
          "headers",
      ];
      const options = Object.assign(Object.assign({ params: {} }, baseOptions), customOptions);
      // merge all keys in customOptions into options.params
      options.params = keys.reduce((value, key) => {
          if (customOptions[key] ||
              typeof customOptions[key] === "boolean" ||
              (typeof customOptions[key] === "number" && customOptions[key] === 0)) {
              value[key] = customOptions[key];
          }
          return value;
      }, options.params);
      // now remove all properties in options that don't exist in IRequestOptions
      return requestOptionsKeys.reduce((value, key) => {
          if (options[key]) {
              value[key] = options[key];
          }
          return value;
      }, {});
  }

  /* Copyright (c) 2022 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * There are 5 potential error codes that might be thrown by {@linkcode ArcGISTokenRequestError}. 2 of these codes are used by both
   * {@linkcode ArcGISIdentityManager} or {@linkcode ApplicationCredentialsManager}:
   *
   * * `TOKEN_REFRESH_FAILED` when a request for an new access token fails.
   * * `UNKNOWN_ERROR_CODE` the error is unknown. More information may be available in {@linkcode ArcGISTokenRequestError.response}
   *
   * The 3 remaining error codes will only be thrown when using {@linkcode ArcGISIdentityManager}:
   *
   * * `GENERATE_TOKEN_FOR_SERVER_FAILED` when a request for a token for a specific federated server fails.
   * * `REFRESH_TOKEN_EXCHANGE_FAILED` when a request for a new refresh token fails.
   * * `NOT_FEDERATED` when the requested server isn't federated with the portal specified in {@linkcode ArcGISIdentityManager.portal}.
   */
  exports.ArcGISTokenRequestErrorCodes = void 0;
  (function (ArcGISTokenRequestErrorCodes) {
      ArcGISTokenRequestErrorCodes["TOKEN_REFRESH_FAILED"] = "TOKEN_REFRESH_FAILED";
      ArcGISTokenRequestErrorCodes["GENERATE_TOKEN_FOR_SERVER_FAILED"] = "GENERATE_TOKEN_FOR_SERVER_FAILED";
      ArcGISTokenRequestErrorCodes["REFRESH_TOKEN_EXCHANGE_FAILED"] = "REFRESH_TOKEN_EXCHANGE_FAILED";
      ArcGISTokenRequestErrorCodes["NOT_FEDERATED"] = "NOT_FEDERATED";
      ArcGISTokenRequestErrorCodes["UNKNOWN_ERROR_CODE"] = "UNKNOWN_ERROR_CODE";
  })(exports.ArcGISTokenRequestErrorCodes || (exports.ArcGISTokenRequestErrorCodes = {}));
  /**
   * This error is thrown when {@linkcode ArcGISIdentityManager} or {@linkcode ApplicationCredentialsManager} fails to refresh a token or generate a new token
   * for a request. Generally in this scenario the credentials are invalid for the request and the you should recreate the {@linkcode ApplicationCredentialsManager}
   * or prompt the user to authenticate again with {@linkcode ArcGISIdentityManager}. See {@linkcode ArcGISTokenRequestErrorCodes} for a more detailed description of
   * the possible error codes.
   *
   * ```js
   * request(someUrl, {
   *   authentication: someAuthenticationManager
   * }).catch(e => {
   *   if(e.name === "ArcGISTokenRequestError") {
   *     // ArcGIS REST JS could not generate an appropriate token for this request
   *     // All credentials are likely invalid and the authentication process should be restarted
   *   }
   * })
   * ```
   */
  class ArcGISTokenRequestError extends Error {
      /**
       * Create a new `ArcGISTokenRequestError`  object.
       *
       * @param message - The error message from the API
       * @param code - The error code from the API
       * @param response - The original response from the API that caused the error
       * @param url - The original url of the request
       * @param options - The original options and parameters of the request
       */
      constructor(message = "UNKNOWN_ERROR", code = exports.ArcGISTokenRequestErrorCodes.UNKNOWN_ERROR_CODE, response, url, options) {
          // 'Error' breaks prototype chain here
          super(message);
          // restore prototype chain, see https://stackoverflow.com/questions/41102060/typescript-extending-error-class
          // we don't need to check for Object.setPrototypeOf as in the answers because we are ES2017 now.
          // Also see https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
          // and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types
          const actualProto = new.target.prototype;
          Object.setPrototypeOf(this, actualProto);
          this.name = "ArcGISTokenRequestError";
          this.message = `${code}: ${message}`;
          this.originalMessage = message;
          this.code = code;
          this.response = response;
          this.url = url;
          this.options = options;
      }
  }

  /* Copyright (c) 2022 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * This error code will be thrown by the following methods when the user cancels or denies an authorization request on the OAuth 2.0
   * authorization screen.
   *
   * * {@linkcode ArcGISIdentityManager.beginOAuth2} when the `popup` option is `true`
   * * {@linkcode ArcGISIdentityManager.completeOAuth2}  when the `popup` option is `false`
   *
   * ```js
   * import { ArcGISIdentityManager } from "@esri/arcgis-rest-request";
   *
   * ArcGISIdentityManager.beginOAuth2({
   *   clientId: "***"
   *   redirectUri: "***",
   *   popup: true
   * }).then(authenticationManager => {
   *   console.log("OAuth 2.0 Successful");
   * }).catch(e => {
   *   if(e.name === "ArcGISAccessDeniedError") {
   *     console.log("The user did not authorize your app.")
   *   } else {
   *     console.log("Something else went wrong. Error:", e);
   *   }
   * })
   * ```
   */
  class ArcGISAccessDeniedError extends Error {
      /**
       * Create a new `ArcGISAccessDeniedError`  object.
       */
      constructor() {
          const message = "The user has denied your authorization request.";
          super(message);
          // restore prototype chain, see https://stackoverflow.com/questions/41102060/typescript-extending-error-class
          // we don't need to check for Object.setPrototypeOf as in the answers because we are ES2017 now.
          // Also see https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
          // and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types
          const actualProto = new.target.prototype;
          Object.setPrototypeOf(this, actualProto);
          this.name = "ArcGISAccessDeniedError";
      }
  }

  /* Copyright (c) 2018 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Helper method to ensure that user supplied urls don't include whitespace or a trailing slash.
   */
  function cleanUrl(url) {
      // Guard so we don't try to trim something that's not a string
      if (typeof url !== "string") {
          return url;
      }
      // trim leading and trailing spaces, but not spaces inside the url
      url = url.trim();
      // remove the trailing slash to the url if one was included
      if (url[url.length - 1] === "/") {
          url = url.slice(0, -1);
      }
      return url;
  }

  /* Copyright (c) 2017-2020 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  function decodeParam(param) {
      const [key, value] = param.split("=");
      return { key: decodeURIComponent(key), value: decodeURIComponent(value) };
  }
  /**
   * Decodes the passed query string as an object.
   *
   * @param query A string to be decoded.
   * @returns A decoded query param object.
   */
  function decodeQueryString(query) {
      if (!query || query.length <= 0) {
          return {};
      }
      return query
          .replace(/^#/, "")
          .replace(/^\?/, "")
          .split("&")
          .reduce((acc, entry) => {
          const { key, value } = decodeParam(entry);
          acc[key] = value;
          return acc;
      }, {});
  }

  /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Enum describing the different errors that might be thrown by a request.
   *
   * ```ts
   * import { request, ErrorTypes } from '@esri/arcgis-rest-request';
   *
   * request("...").catch((e) => {
   *   switch(e.name) {
   *     case ErrorType.ArcGISRequestError:
   *     // handle a general error from the API
   *     break;
   *
   *     case ErrorType.ArcGISAuthError:
   *     // handle an authentication error
   *     break;
   *
   *     case ErrorType.ArcGISAccessDeniedError:
   *     // handle a user denying an authorization request in an oAuth workflow
   *     break;
   *
   *     default:
   *     // handle some other error (usually a network error)
   *   }
   * });
   * ```
   */
  exports.ErrorTypes = void 0;
  (function (ErrorTypes) {
      ErrorTypes["ArcGISRequestError"] = "ArcGISRequestError";
      ErrorTypes["ArcGISAuthError"] = "ArcGISAuthError";
      ErrorTypes["ArcGISAccessDeniedError"] = "ArcGISAccessDeniedError";
      ErrorTypes["ArcGISTokenRequestError"] = "ArcGISTokenRequestError";
  })(exports.ErrorTypes || (exports.ErrorTypes = {}));

  /* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  const FIVE_MINUTES_IN_MILLISECONDS = 5 * 60 * 1000;
  function fetchToken(url, requestOptions) {
      const options = requestOptions;
      // we generate a response, so we can't return the raw response
      options.rawResponse = false;
      return request(url, options).then((response) => {
          const r = {
              token: response.access_token,
              username: response.username,
              expires: new Date(
              // convert seconds in response to milliseconds and add the value to the current time to calculate a static expiration timestamp
              // we subtract 5 minutes here to make sure that we refresh the token early if the user makes requests
              Date.now() + response.expires_in * 1000 - FIVE_MINUTES_IN_MILLISECONDS),
              ssl: response.ssl === true
          };
          if (response.refresh_token) {
              r.refreshToken = response.refresh_token;
          }
          if (response.refresh_token_expires_in) {
              r.refreshTokenExpires = new Date(
              // convert seconds in response to milliseconds and add the value to the current time to calculate a static expiration timestamp
              // we subtract 5 minutes here to make sure that we refresh the token early if the user makes requests
              Date.now() +
                  response.refresh_token_expires_in * 1000 -
                  FIVE_MINUTES_IN_MILLISECONDS);
          }
          return r;
      });
  }

  /* Copyright (c) 2017-2018 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Used to authenticate methods in ArcGIS REST JS with oAuth 2.0 application credentials. The instance of `ApplicationCredentialsManager` can be passed to {@linkcode IRequestOptions.authentication} to authenticate requests.
   *
   * ```js
   * import { ApplicationSession } from '@esri/arcgis-rest-auth';
   *
   * const session = ApplicationCredentialsManager.fromCredentials({
   *   clientId: "abc123",
   *   clientSecret: "••••••"
   * })
   * ```
   */
  class ApplicationCredentialsManager {
      constructor(options) {
          this.clientId = options.clientId;
          this.clientSecret = options.clientSecret;
          this.token = options.token;
          this.expires = options.expires;
          this.portal = options.portal || "https://www.arcgis.com/sharing/rest";
          this.duration = options.duration || 7200;
      }
      /**
       * Preferred method for creating an `ApplicationCredentialsManager`
       */
      static fromCredentials(options) {
          return new ApplicationCredentialsManager(options);
      }
      // URL is not actually read or passed through.
      getToken(url, requestOptions) {
          if (this.token && this.expires && this.expires.getTime() > Date.now()) {
              return Promise.resolve(this.token);
          }
          if (this._pendingTokenRequest) {
              return this._pendingTokenRequest;
          }
          this._pendingTokenRequest = this.refreshToken(requestOptions);
          return this._pendingTokenRequest;
      }
      refreshToken(requestOptions) {
          const options = Object.assign({ params: {
                  client_id: this.clientId,
                  client_secret: this.clientSecret,
                  grant_type: "client_credentials",
                  expiration: this.duration
              } }, requestOptions);
          return fetchToken(`${this.portal}/oauth2/token/`, options)
              .then((response) => {
              this._pendingTokenRequest = null;
              this.token = response.token;
              this.expires = response.expires;
              return response.token;
          })
              .catch((e) => {
              throw new ArcGISTokenRequestError(e.message, exports.ArcGISTokenRequestErrorCodes.TOKEN_REFRESH_FAILED, e.response, e.url, e.options);
          });
      }
      refreshCredentials() {
          return this.refreshToken().then(() => this);
      }
  }
  /**
   * @deprecated - Use {@linkcode ApplicationCredentialsManager}.
   * @internal
   */ /* istanbul ignore next */
  function ApplicationSession(options) {
      console.log("DEPRECATED:, 'ApplicationSession' is deprecated. Use 'ApplicationCredentialsManager' instead.");
      return new ApplicationCredentialsManager(options);
  }

  /* Copyright (c) 2017-2019 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Used to authenticate methods in ArcGIS REST JS with an API keys. The instance of `ApiKeyManager` can be passed to  {@linkcode IRequestOptions.authentication} to authenticate requests.
   *
   * ```js
   * import { ApiKeyManager } from '@esri/arcgis-rest-auth';
   
   * const apiKey = new ApiKeyManager.fromKey("...");
   * ```
   *
   * In most cases however the API key can be passed directly to the {@linkcode IRequestOptions.authentication}.
   */
  class ApiKeyManager {
      constructor(options) {
          /**
           * The current portal the user is authenticated with.
           */
          this.portal = "https://www.arcgis.com/sharing/rest";
          this.key = options.key;
      }
      /**
       * The preferred method for creating an instance of `ApiKeyManager`.
       */
      static fromKey(apiKey) {
          return new ApiKeyManager({ key: apiKey });
      }
      /**
       * Gets a token (the API Key).
       */
      getToken(url) {
          return Promise.resolve(this.key);
      }
  }
  /**
   * @deprecated - Use {@linkcode ApiKeyManager}.
   * @internal
   */ /* istanbul ignore next */
  function ApiKey(options) {
      console.log("DEPRECATED:, 'ApiKey' is deprecated. Use 'ApiKeyManager' instead.");
      return new ApiKeyManager(options);
  }

  /**
   * Used to test if a URL is an ArcGIS Online URL
   */
  const arcgisOnlineUrlRegex = /^https?:\/\/(\S+)\.arcgis\.com.+/;
  function isOnline(url) {
      return arcgisOnlineUrlRegex.test(url);
  }
  function normalizeOnlinePortalUrl(portalUrl) {
      if (!arcgisOnlineUrlRegex.test(portalUrl)) {
          return portalUrl;
      }
      switch (getOnlineEnvironment(portalUrl)) {
          case "dev":
              return "https://devext.arcgis.com/sharing/rest";
          case "qa":
              return "https://qaext.arcgis.com/sharing/rest";
          default:
              return "https://www.arcgis.com/sharing/rest";
      }
  }
  function getOnlineEnvironment(url) {
      if (!arcgisOnlineUrlRegex.test(url)) {
          return null;
      }
      const match = url.match(arcgisOnlineUrlRegex);
      const subdomain = match[1].split(".").pop();
      if (subdomain.includes("dev")) {
          return "dev";
      }
      if (subdomain.includes("qa")) {
          return "qa";
      }
      return "production";
  }
  function isFederated(owningSystemUrl, portalUrl) {
      const normalizedPortalUrl = cleanUrl(normalizeOnlinePortalUrl(portalUrl)).replace(/https?:\/\//, "");
      const normalizedOwningSystemUrl = cleanUrl(owningSystemUrl).replace(/https?:\/\//, "");
      return new RegExp(normalizedOwningSystemUrl, "i").test(normalizedPortalUrl);
  }
  function canUseOnlineToken(portalUrl, requestUrl) {
      const portalIsOnline = isOnline(portalUrl);
      const requestIsOnline = isOnline(requestUrl);
      const portalEnv = getOnlineEnvironment(portalUrl);
      const requestEnv = getOnlineEnvironment(requestUrl);
      if (portalIsOnline && requestIsOnline && portalEnv === requestEnv) {
          return true;
      }
      return false;
  }

  /* Copyright (c) 2018-2020 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Validates that the user has access to the application
   * and if they user should be presented a "View Only" mode
   *
   * This is only needed/valid for Esri applications that are "licensed"
   * and shipped in ArcGIS Online or ArcGIS Enterprise. Most custom applications
   * should not need or use this.
   *
   * ```js
   * import { validateAppAccess } from '@esri/arcgis-rest-auth';
   *
   * return validateAppAccess('your-token', 'theClientId')
   * .then((result) => {
   *    if (!result.value) {
   *      // redirect or show some other ui
   *    } else {
   *      if (result.viewOnlyUserTypeApp) {
   *        // use this to inform your app to show a "View Only" mode
   *      }
   *    }
   * })
   * .catch((err) => {
   *  // two possible errors
   *  // invalid clientId: {"error":{"code":400,"messageCode":"GWM_0007","message":"Invalid request","details":[]}}
   *  // invalid token: {"error":{"code":498,"message":"Invalid token.","details":[]}}
   * })
   * ```
   *
   * Note: This is only usable by Esri applications hosted on *arcgis.com, *esri.com or within
   * an ArcGIS Enterprise installation. Custom applications can not use this.
   *
   * @param token platform token
   * @param clientId application client id
   * @param portal Optional
   */
  function validateAppAccess(token, clientId, portal = "https://www.arcgis.com/sharing/rest") {
      const url = `${portal}/oauth2/validateAppAccess`;
      const ro = {
          method: "POST",
          params: {
              f: "json",
              client_id: clientId,
              token
          }
      };
      return request(url, ro);
  }

  /**
   * Revokes a token generated via any oAuth 2.0 method. `token` can be either a refresh token OR an access token. If you are using  {@linkcode ArcGISIdentityManager} you should use  {@linkcode ArcGISIdentityManager.destroy} instead. Cannot revoke API keys or tokens generated by {@linkcode ApplicationCredentialsManager}.
   *
   * See [`revokeToken`](https://developers.arcgis.com/rest/users-groups-and-items/revoke-token.htm) on the ArcGIS REST API for more details.
   */
  function revokeToken(requestOptions) {
      const url = `${cleanUrl(requestOptions.portal || "https://www.arcgis.com/sharing/rest")}/oauth2/revokeToken/`;
      const token = requestOptions.token;
      const clientId = requestOptions.clientId;
      delete requestOptions.portal;
      delete requestOptions.clientId;
      delete requestOptions.token;
      const options = Object.assign(Object.assign({}, requestOptions), { httpMethod: "POST", params: {
              client_id: clientId,
              auth_token: token
          } });
      return request(url, options).then((response) => {
          if (!response.success) {
              throw new ArcGISRequestError("Unable to revoke token", 500, response, url, options);
          }
          return response;
      });
  }

  /**
   * Encodes a `Uint8Array` to base 64. Used internally for hashing the `code_verifier` and `code_challenge` for PKCE.
   */
  function base64UrlEncode(value, win = window) {
      /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
      if (!win && window) {
          win = window;
      }
      return win
          .btoa(String.fromCharCode.apply(null, value))
          .replace(/\+/g, "-") // replace + with -
          .replace(/\//g, "_") // replace / with _
          .replace(/=+$/, ""); // trim trailing =
  }

  /**
   * Utility to hash the codeVerifier using sha256
   */
  function generateCodeChallenge(codeVerifier, win = window) {
      /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
      if (!win && window) {
          win = window;
      }
      if (codeVerifier && win.isSecureContext && win.crypto && win.crypto.subtle) {
          const encoder = new win.TextEncoder();
          const bytes = encoder.encode(codeVerifier);
          return win.crypto.subtle
              .digest("SHA-256", bytes)
              .then((buffer) => base64UrlEncode(new Uint8Array(buffer), win));
      }
      return Promise.resolve(null);
  }

  /**
   * Utility to generate a random string to use as our `code_verifier`
   *
   * @param win the global `window` object for accepting a mock while testing.
   */
  function generateRandomString(win) {
      /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
      if (!win && window) {
          win = window;
      }
      const randomBytes = win.crypto.getRandomValues(new Uint8Array(32));
      return base64UrlEncode(randomBytes);
  }

  /* Copyright (c) 2017-2019 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Used to authenticate both ArcGIS Online and ArcGIS Enterprise users. `ArcGISIdentityManager` includes helper methods for [OAuth 2.0](https://developers.arcgis.com/documentation/mapping-apis-and-services/security/oauth-2.0/) in both browser and server applications.
   *
   * **It is not recommended to construct `ArcGISIdentityManager` directly**. Instead there are several static methods used for specific workflows. The 2 primary workflows relate to oAuth 2.0:
   *
   * * {@linkcode ArcGISIdentityManager.beginOAuth2} and {@linkcode ArcGISIdentityManager.completeOAuth2} for oAuth 2.0 in browser-only environment.
   * * {@linkcode ArcGISIdentityManager.authorize} and {@linkcode ArcGISIdentityManager.exchangeAuthorizationCode} for oAuth 2.0 for server-enabled application.
   *
   * Other more specialized helpers for less common workflows also exist:
   *
   * * {@linkcode ArcGISIdentityManager.fromToken} for when you have an existing token from another source and would like create an `ArcGISIdentityManager` instance.
   * * {@linkcode ArcGISIdentityManager.fromCredential} for creating  an `ArcGISIdentityManager` instance from a `Credentials` object in the ArcGIS JS API `IdentityManager`
   * * {@linkcode ArcGISIdentityManager.signIn} for authenticating directly with a users username and password for environments with a user interface for oAuth 2.0.
   *
   * Once a manager is created there are additional utilities:
   *
   * * {@linkcode ArcGISIdentityManager.serialize} can be used to create a JSON object representing an instance of `ArcGISIdentityManager`
   * * {@linkcode ArcGISIdentityManager.deserialize} will create a new `ArcGISIdentityManager` from a JSON object created with {@linkcode ArcGISIdentityManager.serialize}
   * * {@linkcode ArcGISIdentityManager.destroy} or {@linkcode ArcGISIdentityManager.signOut} will invalidate any tokens in use by the  `ArcGISIdentityManager`.
   */
  class ArcGISIdentityManager {
      constructor(options) {
          this.clientId = options.clientId;
          this._refreshToken = options.refreshToken;
          this._refreshTokenExpires = options.refreshTokenExpires;
          this._username = options.username;
          this.password = options.password;
          this._token = options.token;
          this._tokenExpires = options.tokenExpires;
          this.portal = options.portal
              ? cleanUrl(options.portal)
              : "https://www.arcgis.com/sharing/rest";
          this.ssl = options.ssl;
          this.provider = options.provider || "arcgis";
          this.tokenDuration = options.tokenDuration || 20160;
          this.redirectUri = options.redirectUri;
          this.server = options.server;
          this.federatedServers = {};
          this.trustedDomains = [];
          // if a non-federated server was passed explicitly, it should be trusted.
          if (options.server) {
              // if the url includes more than '/arcgis/', trim the rest
              const root = this.getServerRootUrl(options.server);
              this.federatedServers[root] = {
                  token: options.token,
                  expires: options.tokenExpires
              };
          }
          this._pendingTokenRequests = {};
      }
      /**
       * The current ArcGIS Online or ArcGIS Enterprise `token`.
       */
      get token() {
          return this._token;
      }
      /**
       * The expiration time of the current `token`.
       */
      get tokenExpires() {
          return this._tokenExpires;
      }
      /**
       * The current token to ArcGIS Online or ArcGIS Enterprise.
       */
      get refreshToken() {
          return this._refreshToken;
      }
      /**
       * The expiration time of the current `refreshToken`.
       */
      get refreshTokenExpires() {
          return this._refreshTokenExpires;
      }
      /**
       * The currently authenticated user.
       */
      get username() {
          if (this._username) {
              return this._username;
          }
          if (this._user && this._user.username) {
              return this._user.username;
          }
      }
      /**
       * Returns `true` if these credentials can be refreshed and `false` if it cannot.
       */
      get canRefresh() {
          if (this.username && this.password) {
              return true;
          }
          if (this.clientId && this.refreshToken) {
              return true;
          }
          return false;
      }
      /**
       * Begins a new browser-based OAuth 2.0 sign in. If `options.popup` is `true` the authentication window will open in a new tab/window. Otherwise, the user will be redirected to the authorization page in their current tab/window and the function will return `undefined`.
       *
       * If `popup` is `true` (the default) this method will return a `Promise` that resolves to an `ArcGISIdentityManager` instance and you must call {@linkcode ArcGISIdentityManager.completeOAuth2} on the page defined in the `redirectUri`. Otherwise it will return undefined and the {@linkcode ArcGISIdentityManager.completeOAuth2} method will return a `Promise` that resolves to an `ArcGISIdentityManager` instance.
       *
       * A {@linkcode ArcGISAccessDeniedError} error will be thrown if the user denies the request on the authorization screen.
       *
       * @browserOnly
       */
      static beginOAuth2(options, win) {
          /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
          if (!win && window) {
              win = window;
          }
          const { portal, provider, clientId, expiration, redirectUri, popup, popupWindowFeatures, locale, params, style, pkce, state } = Object.assign({
              portal: "https://www.arcgis.com/sharing/rest",
              provider: "arcgis",
              expiration: 20160,
              popup: true,
              popupWindowFeatures: "height=400,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes",
              locale: "",
              style: "",
              pkce: true
          }, options);
          /**
           * Generate a  random string for the `state` param and store it in local storage. This is used
           * to validate that all parts of the oAuth process were performed on the same client.
           */
          const stateId = state || generateRandomString(win);
          const stateStorageKey = `ARCGIS_REST_JS_AUTH_STATE_${clientId}`;
          win.localStorage.setItem(stateStorageKey, stateId);
          // Start setting up the URL to the authorization screen.
          let authorizeUrl = `${cleanUrl(portal)}/oauth2/authorize`;
          const authorizeUrlParams = {
              client_id: clientId,
              response_type: pkce ? "code" : "token",
              expiration: expiration,
              redirect_uri: redirectUri,
              state: JSON.stringify({
                  id: stateId,
                  originalUrl: win.location.href // this is used to reset the URL back the original URL upon return
              }),
              locale: locale,
              style: style
          };
          // If we are authorizing through a specific social provider update the params and base URL.
          if (provider !== "arcgis") {
              authorizeUrl = `${cleanUrl(portal)}/oauth2/social/authorize`;
              authorizeUrlParams.socialLoginProviderName = provider;
              authorizeUrlParams.autoAccountCreateForSocial = true;
          }
          /**
           * set a value that will be set to a promise which will later resolve when we are ready
           * to send users to the authorization page.
           */
          let setupAuth;
          if (pkce) {
              /**
               * If we are authenticating with PKCE we need to generate the code challenge which is
               * async so we generate the code challenge and assign the resulting Promise to `setupAuth`
               */
              const codeVerifier = generateRandomString(win);
              const codeVerifierStorageKey = `ARCGIS_REST_JS_CODE_VERIFIER_${clientId}`;
              win.localStorage.setItem(codeVerifierStorageKey, codeVerifier);
              setupAuth = generateCodeChallenge(codeVerifier, win).then(function (codeChallenge) {
                  authorizeUrlParams.code_challenge_method = codeChallenge
                      ? "S256"
                      : "plain";
                  authorizeUrlParams.code_challenge = codeChallenge
                      ? codeChallenge
                      : codeVerifier;
              });
          }
          else {
              /**
               * If we aren't authenticating with PKCE we can just assign a resolved promise to `setupAuth`
               */
              setupAuth = Promise.resolve();
          }
          /**
           * Once we are done setting up with (for PKCE) we can start the auth process.
           */
          return setupAuth.then(() => {
              // combine the authorize URL and params
              authorizeUrl = `${authorizeUrl}?${encodeQueryString(authorizeUrlParams)}`;
              // append additional params passed by the user
              if (params) {
                  authorizeUrl = `${authorizeUrl}&${encodeQueryString(params)}`;
              }
              if (popup) {
                  // If we are authenticating a popup we need to return a Promise that will resolve to an ArcGISIdentityManager later.
                  return new Promise((resolve, reject) => {
                      // Add an event listener to listen for when a user calls `ArcGISIdentityManager.completeOAuth2()` in the popup.
                      win.addEventListener(`arcgis-rest-js-popup-auth-${clientId}`, (e) => {
                          if (e.detail.error === "access_denied") {
                              const error = new ArcGISAccessDeniedError();
                              reject(error);
                              return error;
                          }
                          if (e.detail.error) {
                              const error = new ArcGISAuthError(e.detail.errorMessage, e.detail.error);
                              reject(error);
                              return error;
                          }
                          resolve(new ArcGISIdentityManager({
                              clientId,
                              portal,
                              ssl: e.detail.ssl,
                              token: e.detail.token,
                              tokenExpires: e.detail.expires,
                              username: e.detail.username,
                              refreshToken: e.detail.refreshToken,
                              refreshTokenExpires: e.detail.refreshTokenExpires
                          }));
                      }, {
                          once: true
                      });
                      // open the popup
                      win.open(authorizeUrl, "oauth-window", popupWindowFeatures);
                      win.dispatchEvent(new CustomEvent("arcgis-rest-js-popup-auth-start"));
                  });
              }
              else {
                  // If we aren't authenticating with a popup just send the user to the authorization page.
                  win.location.href = authorizeUrl;
                  return undefined;
              }
          });
      }
      /**
       * Completes a browser-based OAuth 2.0 sign in. If `options.popup` is `true` the user
       * will be returned to the previous window and the popup will close. Otherwise a new `ArcGISIdentityManager` will be returned. You must pass the same values for `clientId`, `popup`, `portal`, and `pkce` as you used in `beginOAuth2()`.
       *
       * A {@linkcode ArcGISAccessDeniedError} error will be thrown if the user denies the request on the authorization screen.
       * @browserOnly
       */
      static completeOAuth2(options, win) {
          /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
          if (!win && window) {
              win = window;
          }
          // pull out necessary options
          const { portal, clientId, popup, pkce } = Object.assign({
              portal: "https://www.arcgis.com/sharing/rest",
              popup: true,
              pkce: true
          }, options);
          // pull the saved state id out of local storage
          const stateStorageKey = `ARCGIS_REST_JS_AUTH_STATE_${clientId}`;
          const stateId = win.localStorage.getItem(stateStorageKey);
          // get the params provided by the server and compare the server state with the client saved state
          const params = decodeQueryString(pkce
              ? win.location.search.replace(/^\?/, "")
              : win.location.hash.replace(/^#/, ""));
          const state = params && params.state ? JSON.parse(params.state) : undefined;
          function reportError(errorMessage, error, originalUrl) {
              win.localStorage.removeItem(stateStorageKey);
              if (popup && win.opener) {
                  win.opener.dispatchEvent(new CustomEvent(`arcgis-rest-js-popup-auth-${clientId}`, {
                      detail: {
                          error,
                          errorMessage
                      }
                  }));
                  win.close();
                  return;
              }
              if (originalUrl) {
                  win.history.replaceState(win.history.state, "", originalUrl);
              }
              if (error === "access_denied") {
                  return Promise.reject(new ArcGISAccessDeniedError());
              }
              return Promise.reject(new ArcGISAuthError(errorMessage, error));
          }
          // create a function to create the final ArcGISIdentityManager from the token info.
          function createManager(oauthInfo, originalUrl) {
              win.localStorage.removeItem(stateStorageKey);
              if (popup && win.opener) {
                  win.opener.dispatchEvent(new CustomEvent(`arcgis-rest-js-popup-auth-${clientId}`, {
                      detail: Object.assign({}, oauthInfo)
                  }));
                  win.close();
                  return;
              }
              win.history.replaceState(win.history.state, "", originalUrl);
              return new ArcGISIdentityManager({
                  clientId,
                  portal,
                  ssl: oauthInfo.ssl,
                  token: oauthInfo.token,
                  tokenExpires: oauthInfo.expires,
                  username: oauthInfo.username,
                  refreshToken: oauthInfo.refreshToken,
                  refreshTokenExpires: oauthInfo.refreshTokenExpires
              });
          }
          if (!stateId || !state) {
              return reportError("No authentication state was found, call `ArcGISIdentityManager.beginOAuth2(...)` to start the authentication process.", "no-auth-state");
          }
          if (state.id !== stateId) {
              return reportError("Saved client state did not match server sent state.", "mismatched-auth-state");
          }
          if (params.error) {
              const error = params.error;
              const errorMessage = params.error_description || "Unknown error";
              return reportError(errorMessage, error, state.originalUrl);
          }
          /**
           * If we are using PKCE the authorization code will be in the query params.
           * For implicit grants the token will be in the hash.
           */
          if (pkce && params.code) {
              const tokenEndpoint = cleanUrl(`${portal}/oauth2/token/`);
              const codeVerifierStorageKey = `ARCGIS_REST_JS_CODE_VERIFIER_${clientId}`;
              const codeVerifier = win.localStorage.getItem(codeVerifierStorageKey);
              win.localStorage.removeItem(codeVerifierStorageKey);
              // exchange our auth code for a token + refresh token
              return fetchToken(tokenEndpoint, {
                  httpMethod: "POST",
                  params: {
                      client_id: clientId,
                      code_verifier: codeVerifier,
                      grant_type: "authorization_code",
                      redirect_uri: location.href.replace(location.search, ""),
                      code: params.code
                  }
              })
                  .then((tokenResponse) => {
                  return createManager(Object.assign(Object.assign({}, tokenResponse), state), state.originalUrl);
              })
                  .catch((e) => {
                  return reportError(e.message, e.error, state.originalUrl);
              });
          }
          if (!pkce && params.access_token) {
              return Promise.resolve(createManager(Object.assign({ token: params.access_token, expires: new Date(Date.now() + parseInt(params.expires_in, 10) * 1000), ssl: params.ssl === "true", username: params.username }, state), state.originalUrl));
          }
          return reportError("Unknown error", "oauth-error", state.originalUrl);
      }
      /**
       * Request credentials information from the parent application
       *
       * When an application is embedded into another application via an IFrame, the embedded app can
       * use `window.postMessage` to request credentials from the host application. This function wraps
       * that behavior.
       *
       * The ArcGIS API for Javascript has this built into the Identity Manager as of the 4.19 release.
       *
       * Note: The parent application will not respond if the embedded app's origin is not:
       * - the same origin as the parent or *.arcgis.com (JSAPI)
       * - in the list of valid child origins (REST-JS)
       *
       *
       * @param parentOrigin origin of the parent frame. Passed into the embedded application as `parentOrigin` query param
       * @browserOnly
       */
      static fromParent(parentOrigin, win) {
          /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
          if (!win && window) {
              win = window;
          }
          // Declare handler outside of promise scope so we can detach it
          let handler;
          // return a promise that will resolve when the handler receives
          // session information from the correct origin
          return new Promise((resolve, reject) => {
              // create an event handler that just wraps the parentMessageHandler
              handler = (event) => {
                  // ensure we only listen to events from the parent
                  if (event.source === win.parent && event.data) {
                      try {
                          return resolve(ArcGISIdentityManager.parentMessageHandler(event));
                      }
                      catch (err) {
                          return reject(err);
                      }
                  }
              };
              // add listener
              win.addEventListener("message", handler, false);
              win.parent.postMessage({ type: "arcgis:auth:requestCredential" }, parentOrigin);
          }).then((manager) => {
              win.removeEventListener("message", handler, false);
              return manager;
          });
      }
      /**
       * Begins a new server-based OAuth 2.0 sign in. This will redirect the user to
       * the ArcGIS Online or ArcGIS Enterprise authorization page.
       *
       * @nodeOnly
       */
      static authorize(options, response) {
          const { portal, clientId, expiration, redirectUri, state } = Object.assign({ portal: "https://arcgis.com/sharing/rest", expiration: 20160 }, options);
          const queryParams = {
              client_id: clientId,
              expiration,
              response_type: "code",
              redirect_uri: redirectUri
          };
          if (state) {
              queryParams.state = state;
          }
          const url = `${portal}/oauth2/authorize?${encodeQueryString(queryParams)}`;
          response.writeHead(301, {
              Location: url
          });
          response.end();
      }
      /**
       * Completes the server-based OAuth 2.0 sign in process by exchanging the `authorizationCode`
       * for a `access_token`.
       *
       * @nodeOnly
       */
      static exchangeAuthorizationCode(options, authorizationCode) {
          const { portal, clientId, redirectUri } = Object.assign({
              portal: "https://www.arcgis.com/sharing/rest"
          }, options);
          return fetchToken(`${portal}/oauth2/token`, {
              params: {
                  grant_type: "authorization_code",
                  client_id: clientId,
                  redirect_uri: redirectUri,
                  code: authorizationCode
              }
          })
              .then((response) => {
              return new ArcGISIdentityManager({
                  clientId,
                  portal,
                  ssl: response.ssl,
                  redirectUri,
                  refreshToken: response.refreshToken,
                  refreshTokenExpires: response.refreshTokenExpires,
                  token: response.token,
                  tokenExpires: response.expires,
                  username: response.username
              });
          })
              .catch((e) => {
              throw new ArcGISTokenRequestError(e.message, exports.ArcGISTokenRequestErrorCodes.REFRESH_TOKEN_EXCHANGE_FAILED, e.response, e.url, e.options);
          });
      }
      static deserialize(str) {
          const options = JSON.parse(str);
          return new ArcGISIdentityManager({
              clientId: options.clientId,
              refreshToken: options.refreshToken,
              refreshTokenExpires: options.refreshTokenExpires
                  ? new Date(options.refreshTokenExpires)
                  : undefined,
              username: options.username,
              password: options.password,
              token: options.token,
              tokenExpires: options.tokenExpires
                  ? new Date(options.tokenExpires)
                  : undefined,
              portal: options.portal,
              ssl: options.ssl,
              tokenDuration: options.tokenDuration,
              redirectUri: options.redirectUri,
              server: options.server
          });
      }
      /**
       * Translates authentication from the format used in the [`IdentityManager` class in the ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-Credential.html).
       *
       * You will need to call both [`IdentityManger.findCredential`](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-IdentityManager.html#findCredential) and [`IdentityManger.findServerInfo`](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-IdentityManager.html#findServerInfo) to obtain both parameters for this method.
       *
       * This method can be used with {@linkcode ArcGISIdentityManager.toCredential} to interop with the ArcGIS API for JavaScript.
       *
       * ```js
       * require(["esri/id"], (esriId) => {
       *   const credential = esriId.findCredential("https://www.arcgis.com/sharing/rest");
       *   const serverInfo = esriId.findServerInfo("https://www.arcgis.com/sharing/rest");
       *
       *   const manager = ArcGISIdentityManager.fromCredential(credential, serverInfo);
       * });
       * ```
       *
       * @returns ArcGISIdentityManager
       */
      static fromCredential(credential, serverInfo) {
          // At ArcGIS Online 9.1, credentials no longer include the ssl and expires properties
          // Here, we provide default values for them to cover this condition
          const ssl = typeof credential.ssl !== "undefined" ? credential.ssl : true;
          const expires = credential.expires || Date.now() + 7200000; /* 2 hours */
          if (serverInfo.hasServer) {
              return new ArcGISIdentityManager({
                  server: credential.server,
                  ssl,
                  token: credential.token,
                  username: credential.userId,
                  tokenExpires: new Date(expires)
              });
          }
          return new ArcGISIdentityManager({
              portal: cleanUrl(credential.server.includes("sharing/rest")
                  ? credential.server
                  : credential.server + `/sharing/rest`),
              ssl,
              token: credential.token,
              username: credential.userId,
              tokenExpires: new Date(expires)
          });
      }
      /**
       * Handle the response from the parent
       * @param event DOM Event
       */
      static parentMessageHandler(event) {
          if (event.data.type === "arcgis:auth:credential") {
              return new ArcGISIdentityManager(event.data.credential);
          }
          if (event.data.type === "arcgis:auth:error") {
              const err = new Error(event.data.error.message);
              err.name = event.data.error.name;
              throw err;
          }
          else {
              throw new Error("Unknown message type.");
          }
      }
      /**
       * Revokes all active tokens for a provided {@linkcode ArcGISIdentityManager}. The can be considered the equivalent to signing the user out of your application.
       */
      static destroy(manager) {
          return revokeToken({
              clientId: manager.clientId,
              portal: manager.portal,
              token: manager.refreshToken || manager.token
          });
      }
      /**
       * Create a  {@linkcode ArcGISIdentityManager} from an existing token. Useful for when you have a users token from a different authentication system and want to get a  {@linkcode ArcGISIdentityManager}.
       */
      static fromToken(options) {
          const manager = new ArcGISIdentityManager(options);
          return manager.getUser().then(() => {
              return manager;
          });
      }
      /**
       * Initialize a {@linkcode ArcGISIdentityManager} with a users `username` and `password`. **This method is intended ONLY for applications without a user interface such as CLI tools.**.
       *
       * If possible you should use {@linkcode ArcGISIdentityManager.beginOAuth2} to authenticate users in a browser or {@linkcode ArcGISIdentityManager.authorize} for authenticating users with a web server.
       */
      static signIn(options) {
          const manager = new ArcGISIdentityManager(options);
          return manager.getUser().then(() => {
              return manager;
          });
      }
      /**
       * Returns authentication in a format useable in the [`IdentityManager.registerToken()` method in the ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-IdentityManager.html#registerToken).
       *
       * This method can be used with {@linkcode ArcGISIdentityManager.fromCredential} to interop with the ArcGIS API for JavaScript.
       *
       * ```js
       * require(["esri/id"], (esriId) => {
       *   esriId.registerToken(manager.toCredential());
       * })
       
       * ```
       *
       * @returns ICredential
       */
      toCredential() {
          return {
              expires: this.tokenExpires.getTime(),
              server: this.server || this.portal,
              ssl: this.ssl,
              token: this.token,
              userId: this.username
          };
      }
      /**
       * Returns information about the currently logged in [user](https://developers.arcgis.com/rest/users-groups-and-items/user.htm). Subsequent calls will *not* result in additional web traffic.
       *
       * ```js
       * manager.getUser()
       *   .then(response => {
       *     console.log(response.role); // "org_admin"
       *   })
       * ```
       *
       * @param requestOptions - Options for the request. NOTE: `rawResponse` is not supported by this operation.
       * @returns A Promise that will resolve with the data from the response.
       */
      getUser(requestOptions) {
          if (this._pendingUserRequest) {
              return this._pendingUserRequest;
          }
          else if (this._user) {
              return Promise.resolve(this._user);
          }
          else {
              const url = `${this.portal}/community/self`;
              const options = Object.assign(Object.assign({ httpMethod: "GET", authentication: this }, requestOptions), { rawResponse: false });
              this._pendingUserRequest = request(url, options).then((response) => {
                  this._user = response;
                  this._pendingUserRequest = null;
                  return response;
              });
              return this._pendingUserRequest;
          }
      }
      /**
       * Returns information about the currently logged in user's [portal](https://developers.arcgis.com/rest/users-groups-and-items/portal-self.htm). Subsequent calls will *not* result in additional web traffic.
       *
       * ```js
       * manager.getPortal()
       *   .then(response => {
       *     console.log(portal.name); // "City of ..."
       *   })
       * ```
       *
       * @param requestOptions - Options for the request. NOTE: `rawResponse` is not supported by this operation.
       * @returns A Promise that will resolve with the data from the response.
       */
      getPortal(requestOptions) {
          if (this._pendingPortalRequest) {
              return this._pendingPortalRequest;
          }
          else if (this._portalInfo) {
              return Promise.resolve(this._portalInfo);
          }
          else {
              const url = `${this.portal}/portals/self`;
              const options = Object.assign(Object.assign({ httpMethod: "GET", authentication: this }, requestOptions), { rawResponse: false });
              this._pendingPortalRequest = request(url, options).then((response) => {
                  this._portalInfo = response;
                  this._pendingPortalRequest = null;
                  return response;
              });
              return this._pendingPortalRequest;
          }
      }
      /**
       * Returns the username for the currently logged in [user](https://developers.arcgis.com/rest/users-groups-and-items/user.htm). Subsequent calls will *not* result in additional web traffic. This is also used internally when a username is required for some requests but is not present in the options.
       *
       * ```js
       * manager.getUsername()
       *   .then(response => {
       *     console.log(response); // "casey_jones"
       *   })
       * ```
       */
      getUsername() {
          if (this.username) {
              return Promise.resolve(this.username);
          }
          else {
              return this.getUser().then((user) => {
                  return user.username;
              });
          }
      }
      /**
       * Gets an appropriate token for the given URL. If `portal` is ArcGIS Online and
       * the request is to an ArcGIS Online domain `token` will be used. If the request
       * is to the current `portal` the current `token` will also be used. However if
       * the request is to an unknown server we will validate the server with a request
       * to our current `portal`.
       */
      getToken(url, requestOptions) {
          if (canUseOnlineToken(this.portal, url)) {
              return this.getFreshToken(requestOptions);
          }
          else if (new RegExp(this.portal, "i").test(url)) {
              return this.getFreshToken(requestOptions);
          }
          else {
              return this.getTokenForServer(url, requestOptions);
          }
      }
      /**
       * Get application access information for the current user
       * see `validateAppAccess` function for details
       *
       * @param clientId application client id
       */
      validateAppAccess(clientId) {
          return this.getToken(this.portal).then((token) => {
              return validateAppAccess(token, clientId);
          });
      }
      toJSON() {
          return {
              clientId: this.clientId,
              refreshToken: this.refreshToken,
              refreshTokenExpires: this.refreshTokenExpires || undefined,
              username: this.username,
              password: this.password,
              token: this.token,
              tokenExpires: this.tokenExpires || undefined,
              portal: this.portal,
              ssl: this.ssl,
              tokenDuration: this.tokenDuration,
              redirectUri: this.redirectUri,
              server: this.server
          };
      }
      serialize() {
          return JSON.stringify(this);
      }
      /**
       * For a "Host" app that embeds other platform apps via iframes, after authenticating the user
       * and creating a ArcGISIdentityManager, the app can then enable "post message" style authentication by calling
       * this method.
       *
       * Internally this adds an event listener on window for the `message` event
       *
       * @param validChildOrigins Array of origins that are allowed to request authentication from the host app
       */
      enablePostMessageAuth(validChildOrigins, win) {
          /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
          if (!win && window) {
              win = window;
          }
          this._hostHandler = this.createPostMessageHandler(validChildOrigins);
          win.addEventListener("message", this._hostHandler, false);
      }
      /**
       * For a "Host" app that has embedded other platform apps via iframes, when the host needs
       * to transition routes, it should call `ArcGISIdentityManager.disablePostMessageAuth()` to remove
       * the event listener and prevent memory leaks
       */
      disablePostMessageAuth(win) {
          /* istanbul ignore next: must pass in a mockwindow for tests so we can't cover the other branch */
          if (!win && window) {
              win = window;
          }
          win.removeEventListener("message", this._hostHandler, false);
      }
      /**
       * Manually refreshes the current `token` and `tokenExpires`.
       */
      refreshCredentials(requestOptions) {
          // make sure subsequent calls to getUser() don't returned cached metadata
          this._user = null;
          if (this.username && this.password) {
              return this.refreshWithUsernameAndPassword(requestOptions);
          }
          if (this.clientId && this.refreshToken) {
              return this.refreshWithRefreshToken();
          }
          return Promise.reject(new ArcGISTokenRequestError("Unable to refresh token. No refresh token or password present.", exports.ArcGISTokenRequestErrorCodes.TOKEN_REFRESH_FAILED));
      }
      /**
       * Determines the root of the ArcGIS Server or Portal for a given URL.
       *
       * @param url the URl to determine the root url for.
       */
      getServerRootUrl(url) {
          const [root] = cleanUrl(url).split(/\/rest(\/admin)?\/services(?:\/|#|\?|$)/);
          const [match, protocol, domainAndPath] = root.match(/(https?:\/\/)(.+)/);
          const [domain, ...path] = domainAndPath.split("/");
          // only the domain is lowercased because in some cases an org id might be
          // in the path which cannot be lowercased.
          return `${protocol}${domain.toLowerCase()}/${path.join("/")}`;
      }
      /**
       * Returns the proper [`credentials`] option for `fetch` for a given domain.
       * See [trusted server](https://enterprise.arcgis.com/en/portal/latest/administer/windows/configure-security.htm#ESRI_SECTION1_70CC159B3540440AB325BE5D89DBE94A).
       * Used internally by underlying request methods to add support for specific security considerations.
       *
       * @param url The url of the request
       * @returns "include" or "same-origin"
       */
      getDomainCredentials(url) {
          if (!this.trustedDomains || !this.trustedDomains.length) {
              return "same-origin";
          }
          return this.trustedDomains.some((domainWithProtocol) => {
              return url.startsWith(domainWithProtocol);
          })
              ? "include"
              : "same-origin";
      }
      /**
       * Convenience method for {@linkcode ArcGISIdentityManager.destroy} for this instance of `ArcGISIdentityManager`
       */
      signOut() {
          return ArcGISIdentityManager.destroy(this);
      }
      /**
       * Return a function that closes over the validOrigins array and
       * can be used as an event handler for the `message` event
       *
       * @param validOrigins Array of valid origins
       */
      createPostMessageHandler(validOrigins) {
          // return a function that closes over the validOrigins and
          // has access to the credential
          return (event) => {
              // Verify that the origin is valid
              // Note: do not use regex's here. validOrigins is an array so we're checking that the event's origin
              // is in the array via exact match. More info about avoiding postMessage xss issues here
              // https://jlajara.gitlab.io/web/2020/07/17/Dom_XSS_PostMessage_2.html#tipsbypasses-in-postmessage-vulnerabilities
              const isValidOrigin = validOrigins.indexOf(event.origin) > -1;
              // JSAPI handles this slightly differently - instead of checking a list, it will respond if
              // event.origin === window.location.origin || event.origin.endsWith('.arcgis.com')
              // For Hub, and to enable cross domain debugging with port's in urls, we are opting to
              // use a list of valid origins
              // Ensure the message type is something we want to handle
              const isValidType = event.data.type === "arcgis:auth:requestCredential";
              // Ensure we don't pass an expired session forward
              const isTokenValid = this.tokenExpires.getTime() > Date.now();
              if (isValidOrigin && isValidType) {
                  let msg = {};
                  if (isTokenValid) {
                      const credential = this.toJSON();
                      msg = {
                          type: "arcgis:auth:credential",
                          credential
                      };
                  }
                  else {
                      msg = {
                          type: "arcgis:auth:error",
                          error: {
                              name: "tokenExpiredError",
                              message: "Token was expired, and not returned to the child application"
                          }
                      };
                  }
                  event.source.postMessage(msg, event.origin);
              }
          };
      }
      /**
       * Validates that a given URL is properly federated with our current `portal`.
       * Attempts to use the internal `federatedServers` cache first.
       */
      getTokenForServer(url, requestOptions) {
          // requests to /rest/services/ and /rest/admin/services/ are both valid
          // Federated servers may have inconsistent casing, so lowerCase it
          const root = this.getServerRootUrl(url);
          const existingToken = this.federatedServers[root];
          if (existingToken &&
              existingToken.expires &&
              existingToken.expires.getTime() > Date.now()) {
              return Promise.resolve(existingToken.token);
          }
          if (this._pendingTokenRequests[root]) {
              return this._pendingTokenRequests[root];
          }
          this._pendingTokenRequests[root] = this.fetchAuthorizedDomains().then(() => {
              return request(`${root}/rest/info`, {
                  credentials: this.getDomainCredentials(url)
              })
                  .then((serverInfo) => {
                  if (serverInfo.owningSystemUrl) {
                      /**
                       * if this server is not owned by this portal
                       * bail out with an error since we know we wont
                       * be able to generate a token
                       */
                      if (!isFederated(serverInfo.owningSystemUrl, this.portal)) {
                          throw new ArcGISTokenRequestError(`${url} is not federated with ${this.portal}.`, exports.ArcGISTokenRequestErrorCodes.NOT_FEDERATED);
                      }
                      else {
                          /**
                           * if the server is federated, use the relevant token endpoint.
                           */
                          return request(`${serverInfo.owningSystemUrl}/sharing/rest/info`, requestOptions);
                      }
                  }
                  else if (serverInfo.authInfo &&
                      this.federatedServers[root] !== undefined) {
                      /**
                       * if its a stand-alone instance of ArcGIS Server that doesn't advertise
                       * federation, but the root server url is recognized, use its built in token endpoint.
                       */
                      return Promise.resolve({
                          authInfo: serverInfo.authInfo
                      });
                  }
                  else {
                      throw new ArcGISTokenRequestError(`${url} is not federated with any portal and is not explicitly trusted.`, exports.ArcGISTokenRequestErrorCodes.NOT_FEDERATED);
                  }
              })
                  .then((serverInfo) => {
                  // an expired token cant be used to generate a new token so refresh our credentials before trying to generate a server token
                  if (this.token && this.tokenExpires.getTime() < Date.now()) {
                      // If we are authenticated to a single server just refresh with username and password and use the new credentials as the credentials for this server.
                      if (this.server) {
                          return this.refreshCredentials().then(() => {
                              return {
                                  token: this.token,
                                  expires: this.tokenExpires
                              };
                          });
                      }
                      // Otherwise refresh the credentials for the portal and generate a URL for the specific server.
                      return this.refreshCredentials().then(() => {
                          return this.generateTokenForServer(serverInfo.authInfo.tokenServicesUrl, root);
                      });
                  }
                  else {
                      return this.generateTokenForServer(serverInfo.authInfo.tokenServicesUrl, root);
                  }
              })
                  .then((response) => {
                  this.federatedServers[root] = response;
                  delete this._pendingTokenRequests[root];
                  return response.token;
              });
          });
          return this._pendingTokenRequests[root];
      }
      /**
       * Generates a token for a given `serverUrl` using a given `tokenServicesUrl`.
       */
      generateTokenForServer(tokenServicesUrl, serverUrl) {
          return request(tokenServicesUrl, {
              params: {
                  token: this.token,
                  serverUrl,
                  expiration: this.tokenDuration
              }
          })
              .then((response) => {
              return {
                  token: response.token,
                  expires: new Date(response.expires - 1000 * 60 * 5)
              };
          })
              .catch((e) => {
              throw new ArcGISTokenRequestError(e.message, exports.ArcGISTokenRequestErrorCodes.GENERATE_TOKEN_FOR_SERVER_FAILED, e.response, e.url, e.options);
          });
      }
      /**
       * Returns an unexpired token for the current `portal`.
       */
      getFreshToken(requestOptions) {
          if (this.token && !this.tokenExpires) {
              return Promise.resolve(this.token);
          }
          if (this.token &&
              this.tokenExpires &&
              this.tokenExpires.getTime() > Date.now()) {
              return Promise.resolve(this.token);
          }
          if (!this._pendingTokenRequests[this.portal]) {
              this._pendingTokenRequests[this.portal] = this.refreshCredentials(requestOptions).then(() => {
                  this._pendingTokenRequests[this.portal] = null;
                  return this.token;
              });
          }
          return this._pendingTokenRequests[this.portal];
      }
      /**
       * Refreshes the current `token` and `tokenExpires` with `username` and
       * `password`.
       */
      refreshWithUsernameAndPassword(requestOptions) {
          const params = {
              username: this.username,
              password: this.password,
              expiration: this.tokenDuration,
              client: "referer",
              referer: typeof window !== "undefined" &&
                  typeof window.document !== "undefined" &&
                  window.location &&
                  window.location.origin
                  ? window.location.origin
                  : /* istanbul ignore next */
                      NODEJS_DEFAULT_REFERER_HEADER
          };
          return (this.server
              ? request(`${this.getServerRootUrl(this.server)}/rest/info`).then((response) => {
                  return request(response.authInfo.tokenServicesUrl, Object.assign({ params }, requestOptions));
              })
              : request(`${this.portal}/generateToken`, Object.assign({ params }, requestOptions)))
              .then((response) => {
              this.updateToken(response.token, new Date(response.expires));
              return this;
          })
              .catch((e) => {
              throw new ArcGISTokenRequestError(e.message, exports.ArcGISTokenRequestErrorCodes.TOKEN_REFRESH_FAILED, e.response, e.url, e.options);
          });
      }
      /**
       * Refreshes the current `token` and `tokenExpires` with `refreshToken`.
       */
      refreshWithRefreshToken(requestOptions) {
          // If our refresh token expires sometime in the next 24 hours then refresh the refresh token
          const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;
          if (this.refreshToken &&
              this.refreshTokenExpires &&
              this.refreshTokenExpires.getTime() - ONE_DAY_IN_MILLISECONDS < Date.now()) {
              return this.exchangeRefreshToken(requestOptions);
          }
          const options = Object.assign({ params: {
                  client_id: this.clientId,
                  refresh_token: this.refreshToken,
                  grant_type: "refresh_token"
              } }, requestOptions);
          return fetchToken(`${this.portal}/oauth2/token`, options)
              .then((response) => {
              return this.updateToken(response.token, response.expires);
          })
              .catch((e) => {
              throw new ArcGISTokenRequestError(e.message, exports.ArcGISTokenRequestErrorCodes.TOKEN_REFRESH_FAILED, e.response, e.url, e.options);
          });
      }
      /**
       * Update the stored {@linkcode ArcGISIdentityManager.token} and {@linkcode ArcGISIdentityManager.tokenExpires} properties. This method is used internally when refreshing tokens.
       * You may need to call this if you want update the token with a new token from an external source.
       *
       * @param newToken The new token to use for this instance of `ArcGISIdentityManager`.
       * @param newTokenExpiration The new expiration date of the token.
       * @returns
       */
      updateToken(newToken, newTokenExpiration) {
          this._token = newToken;
          this._tokenExpires = newTokenExpiration;
          return this;
      }
      /**
       * Exchanges an unexpired `refreshToken` for a new one, also updates `token` and
       * `tokenExpires`.
       */
      exchangeRefreshToken(requestOptions) {
          const options = Object.assign({ params: {
                  client_id: this.clientId,
                  refresh_token: this.refreshToken,
                  redirect_uri: this.redirectUri,
                  grant_type: "exchange_refresh_token"
              } }, requestOptions);
          return fetchToken(`${this.portal}/oauth2/token`, options)
              .then((response) => {
              this._token = response.token;
              this._tokenExpires = response.expires;
              this._refreshToken = response.refreshToken;
              this._refreshTokenExpires = response.refreshTokenExpires;
              return this;
          })
              .catch((e) => {
              throw new ArcGISTokenRequestError(e.message, exports.ArcGISTokenRequestErrorCodes.REFRESH_TOKEN_EXCHANGE_FAILED, e.response, e.url, e.options);
          });
      }
      /**
       * ensures that the authorizedCrossOriginDomains are obtained from the portal and cached
       * so we can check them later.
       *
       * @returns this
       */
      fetchAuthorizedDomains() {
          // if this token is for a specific server or we don't have a portal
          // don't get the portal info because we cant get the authorizedCrossOriginDomains
          if (this.server || !this.portal) {
              return Promise.resolve(this);
          }
          return this.getPortal().then((portalInfo) => {
              /**
               * Specific domains can be configured as secure.esri.com or https://secure.esri.com this
               * normalizes to https://secure.esri.com so we can use startsWith later.
               */
              if (portalInfo.authorizedCrossOriginDomains &&
                  portalInfo.authorizedCrossOriginDomains.length) {
                  this.trustedDomains = portalInfo.authorizedCrossOriginDomains
                      .filter((d) => !d.startsWith("http://"))
                      .map((d) => {
                      if (d.startsWith("https://")) {
                          return d;
                      }
                      else {
                          return `https://${d}`;
                      }
                  });
              }
              return this;
          });
      }
  }
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager}.
   * @internal
   *
   */ /* istanbul ignore next */
  function UserSession(options) {
      console.log("DEPRECATED:, 'UserSession' is deprecated. Use 'ArcGISIdentityManager' instead.");
      return new ArcGISIdentityManager(options);
  }
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager.beginOAuth2}.
   * @internal
   *
   */ /* istanbul ignore next */
  UserSession.beginOAuth2 = function (...args) {
      console.warn("DEPRECATED:, 'UserSession.beginOAuth2' is deprecated. Use 'ArcGISIdentityManager.beginOAuth2' instead.");
      return ArcGISIdentityManager.beginOAuth2(...args);
  };
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager.completeOAuth2}.
   * @internal
   *
   */ /* istanbul ignore next */
  UserSession.completeOAuth2 = function (...args) {
      console.warn("DEPRECATED:, 'UserSession.completeOAuth2' is deprecated. Use 'ArcGISIdentityManager.completeOAuth2' instead.");
      if (args.length <= 1) {
          console.warn("WARNING:, 'UserSession.completeOAuth2' is now async and returns a promise the resolves to an instance of `ArcGISIdentityManager`.");
      }
      return ArcGISIdentityManager.completeOAuth2(...args);
  };
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager.fromParent}.
   * @internal
   *
   */ /* istanbul ignore next */
  UserSession.fromParent = function (...args) {
      console.warn("DEPRECATED:, 'UserSession.fromParent' is deprecated. Use 'ArcGISIdentityManager.fromParent' instead.");
      return ArcGISIdentityManager.fromParent(...args);
  };
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager.authorize}.
   * @internal
   *
   */ /* istanbul ignore next */
  UserSession.authorize = function (...args) {
      console.warn("DEPRECATED:, 'UserSession.authorize' is deprecated. Use 'ArcGISIdentityManager.authorize' instead.");
      return ArcGISIdentityManager.authorize(...args);
  };
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager.exchangeAuthorizationCode}.
   * @internal
   *
   */ /* istanbul ignore next */
  UserSession.exchangeAuthorizationCode = function (...args) {
      console.warn("DEPRECATED:, 'UserSession.exchangeAuthorizationCode' is deprecated. Use 'ArcGISIdentityManager.exchangeAuthorizationCode' instead.");
      return ArcGISIdentityManager.exchangeAuthorizationCode(...args);
  };
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager.fromCredential}.
   * @internal
   *
   */ /* istanbul ignore next */
  UserSession.fromCredential = function (...args) {
      console.log("DEPRECATED:, 'UserSession.fromCredential' is deprecated. Use 'ArcGISIdentityManager.fromCredential' instead.");
      console.warn("WARNING:, 'UserSession.fromCredential' now requires a `ServerInfo` object from the JS API as a second parameter.");
      return ArcGISIdentityManager.fromCredential(...args);
  };
  /**
   * @deprecated - Use {@linkcode ArcGISIdentityManager.deserialize}.
   * @internal
   *
   */ /* istanbul ignore next */
  UserSession.deserialize = function (...args) {
      console.log("DEPRECATED:, 'UserSession.deserialize' is deprecated. Use 'ArcGISIdentityManager.deserialize' instead.");
      return ArcGISIdentityManager.deserialize(...args);
  };

  /* Copyright (c) 2018-2020 Environmental Systems Research Institute, Inc.
   * Apache-2.0 */
  /**
   * Request app-specific token, passing in the token for the current app.
   *
   * This call returns a token after performing the same checks made by validateAppAccess.
   * It returns an app-specific token of the signed-in user only if the user has access
   * to the app and the encrypted platform cookie is valid.
   *
   * A scenario where an app would use this is if it is iframed into another platform app
   * and receives credentials via postMessage. Those credentials contain a token that is
   * specific to the host app, so the embedded app would use `exchangeToken` to get one
   * that is specific to itself.
   *
   * Note: This is only usable by Esri applications hosted on *arcgis.com, *esri.com or within
   * an ArcGIS Enterprise installation. Custom applications can not use this.
   *
   * @param token
   * @param clientId application
   * @param portal
   */
  function exchangeToken(token, clientId, portal = "https://www.arcgis.com/sharing/rest") {
      const url = `${portal}/oauth2/exchangeToken`;
      const ro = {
          method: "POST",
          params: {
              f: "json",
              client_id: clientId,
              token
          }
      };
      // make the request and return the token
      return request(url, ro).then((response) => response.token);
  }
  /**
   * Request a token for a specific application using the esri_aopc encrypted cookie
   *
   * When a client app boots up, it will know its clientId and the redirectUri for use
   * in the normal /oauth/authorize pop-out oAuth flow.
   *
   * If the app sees an `esri_aopc` cookie (only set if the app is hosted on *.arcgis.com),
   * it can call the /oauth2/platformSelf end-point passing in the clientId and redirectUri
   * in headers, and it will receive back an app-specific token, assuming the user has
   * access to the app.
   *
   * Since there are scenarios where an app can boot using credentials/token from localstorage
   * but those credentials are not for the same user as the esri_aopc cookie, it is recommended that
   * an app check the returned username against any existing identity they may have loaded.
   *
   * Note: This is only usable by Esri applications hosted on *arcgis.com, *esri.com or within
   * an ArcGIS Enterprise installation. Custom applications can not use this.
   *
   * ```js
   * // convert the encrypted platform cookie into a ArcGISIdentityManager
   * import { platformSelf, ArcGISIdentityManager } from '@esri/arcgis-rest-auth';
   *
   * const portal = 'https://www.arcgis.com/sharing/rest';
   * const clientId = 'YOURAPPCLIENTID';
   *
   * // exchange esri_aopc cookie
   * return platformSelf(clientId, 'https://your-app-redirect-uri', portal)
   * .then((response) => {
   *  const currentTimestamp = new Date().getTime();
   *  const tokenExpiresTimestamp = currentTimestamp + (response.expires_in * 1000);
   *  // Construct the session and return it
   *  return new ArcGISIdentityManager({
   *    portal,
   *    clientId,
   *    username: response.username,
   *    token: response.token,
   *    tokenExpires: new Date(tokenExpiresTimestamp),
   *    ssl: true
   *  });
   * })
   *
   * ```
   *
   *
   * @param clientId
   * @param redirectUri
   * @param portal
   */
  function platformSelf(clientId, redirectUri, portal = "https://www.arcgis.com/sharing/rest") {
      // TEMPORARY: the f=json should not be needed, but currently is
      const url = `${portal}/oauth2/platformSelf?f=json`;
      const ro = {
          method: "POST",
          headers: {
              "X-Esri-Auth-Client-Id": clientId,
              "X-Esri-Auth-Redirect-Uri": redirectUri
          },
          // Note: request has logic to include the cookie
          // for platformSelf calls w/ the X-Esri-Auth-Client-Id header
          params: {
              f: "json"
          }
      };
      // make the request and return the token
      return request(url, ro);
  }

  exports.ApiKey = ApiKey;
  exports.ApiKeyManager = ApiKeyManager;
  exports.ApplicationCredentialsManager = ApplicationCredentialsManager;
  exports.ApplicationSession = ApplicationSession;
  exports.ArcGISAccessDeniedError = ArcGISAccessDeniedError;
  exports.ArcGISAuthError = ArcGISAuthError;
  exports.ArcGISIdentityManager = ArcGISIdentityManager;
  exports.ArcGISRequestError = ArcGISRequestError;
  exports.ArcGISTokenRequestError = ArcGISTokenRequestError;
  exports.Blob = Blob$1;
  exports.File = File;
  exports.FormData = FormData;
  exports.NODEJS_DEFAULT_REFERER_HEADER = NODEJS_DEFAULT_REFERER_HEADER;
  exports.UserSession = UserSession;
  exports.appendCustomParams = appendCustomParams;
  exports.canUseOnlineToken = canUseOnlineToken;
  exports.checkForErrors = checkForErrors;
  exports.cleanUrl = cleanUrl;
  exports.decodeParam = decodeParam;
  exports.decodeQueryString = decodeQueryString;
  exports.encodeFormData = encodeFormData;
  exports.encodeParam = encodeParam;
  exports.encodeQueryString = encodeQueryString;
  exports.exchangeToken = exchangeToken;
  exports.fetchToken = fetchToken;
  exports.getDefaultRequestOptions = getDefaultRequestOptions;
  exports.getFetch = getFetch;
  exports.getOnlineEnvironment = getOnlineEnvironment;
  exports.internalRequest = internalRequest;
  exports.isFederated = isFederated;
  exports.isOnline = isOnline;
  exports.normalizeOnlinePortalUrl = normalizeOnlinePortalUrl;
  exports.platformSelf = platformSelf;
  exports.processParams = processParams;
  exports.request = request;
  exports.requiresFormData = requiresFormData;
  exports.revokeToken = revokeToken;
  exports.setDefaultRequestOptions = setDefaultRequestOptions;
  exports.validateAppAccess = validateAppAccess;
  exports.warn = warn;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=request.umd.js.map
