const { RESTDataSource } = require('apollo-datasource-rest');
const crypto = require('crypto');
const uuid = require('uuid-random');
const queryString = require('query-string');

const { LETTERBOXD_API_KEY, LETTERBOXD_API_SECRET } = process.env;
const env = process.env.NODE_ENV || 'dev';

// base URL including version, excluding trailing slash
const API_BASE_URL = 'https://api.letterboxd.com/api/v0';

class LetterboxdAPI extends RESTDataSource {
  constructor() {
    super();

    if (env === 'dev') {
      this.baseURL = 'https://localhost:62917/api/v0';
    } else {
      this.baseURL = API_BASE_URL;
    }
  }

  async getFilm(id) {
    return this.get(`film/${id}`);
  }

  async getFilms(params) {
    return this.get('films', params);
  }

  async getList(id) {
    return this.get(`list/${id}`);
  }

  async getLists(params) {
    return this.get('lists', params);
  }

  async getLogEntry(id) {
    return this.get(`log-entry/${id}`);
  }

  async getLogEntries(params) {
    return this.get('log-entries', params);
  }

  async getMember(id) {
    return this.get(`member/${id}`);
  }

  async getMembers(params) {
    return this.get('members', params);
  }

  async getContributor(id) {
    return this.get(`contributor/${id}`);
  }

  async getGenres() {
    return this.get('films/genres').then(json => json.items);
  }

  async getServices() {
    return this.get('films/film-services').then(json => json.items);
  }

  cacheKeyFor(request) {
    // our cache key removes the params added during the signing process
    // this is necessary for request caching and de-duplication

    let qs = queryString.parseUrl(request.url);
    let queryParams = qs.query;
    delete queryParams.apikey;
    delete queryParams.nonce;
    delete queryParams.signature;
    delete queryParams.timestamp;

    let cacheUrl = qs.url;

    const query = queryString.stringify(queryParams);
    if (query) {
      cacheUrl += `?${query}`;
    }

    return cacheUrl;
  }

  willSendRequest(request) {
    LetterboxdAPI.signRequest(request);
  }

  static signRequest(request) {
    const now = new Date();
    const seconds = Math.round(now.getTime() / 1000);

    request.params.append('apikey', LETTERBOXD_API_KEY);
    request.params.append('nonce', uuid());
    request.params.append('timestamp', seconds);

    const finalUrl = `${API_BASE_URL}/${request.path}?${request.params.toString()}`;

    let saltedString = `${request.method}\u0000${finalUrl}\u0000`;

    if (request.body) {
      saltedString += request.body;
    }

    const signature = crypto
      .createHmac('sha256', LETTERBOXD_API_SECRET)
      .update(saltedString)
      .digest('hex');

    request.params.append('signature', signature);
  }
}

module.exports = LetterboxdAPI;
