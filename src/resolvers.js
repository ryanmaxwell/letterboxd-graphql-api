const fetch = require('node-fetch');
const crypto = require('crypto');
const uuid = require('uuid-random');
const queryString = require('query-string');

const { LETTERBOXD_API_KEY, LETTERBOXD_API_SECRET } = process.env;

const env = process.env.NODE_ENV || 'dev';

// for reverse-proxy debugging during development
if (env === 'dev') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// base URL including version, excluding trailing slash
const API_BASE_URL = 'https://api.letterboxd.com/api/v0';

// Requests

const buildUrl = (method, path, body) => {
  const d = new Date();
  const seconds = Math.round(d.getTime() / 1000);

  let url = `${API_BASE_URL}/${path}`;

  if (!url.includes('?')) {
    url += '?';
  } else {
    url += '&';
  }

  url += `apikey=${LETTERBOXD_API_KEY}&nonce=${uuid()}&timestamp=${seconds}`;

  let saltedString = `${method}\u0000${url}\u0000`;

  if (body) {
    saltedString += body;
  }

  const signature = crypto
    .createHmac('sha256', LETTERBOXD_API_SECRET)
    .update(saltedString)
    .digest('hex');

  url += `&signature=${signature}`;

  return url;
};

const request = async (method, path, body, accessToken) => {
  const url = buildUrl(method, path, body);

  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(url, {
    method,
    headers,
    body,
  });
};

const formRequest = async (method, path, body) => {
  const url = buildUrl(method, path, body);

  const headers = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  return fetch(url, {
    method,
    headers,
    body,
  });
};

// Utility

const fieldResolver = (source, args, context, info) => {
  // ensure source is a value for which property access is acceptable.
  if (typeof source === 'object' || typeof source === 'function') {
    // default resolver behaviour first
    const property = source[info.fieldName];
    if (typeof property === 'function') {
      return source[info.fieldName](args, context, info);
    }
    if (typeof property !== 'undefined') {
      return property;
    }
  }
  // unresolved
  return undefined;
};

const isFilmSummary = film => film.trailer === undefined;
const isListSummary = list => list.links === undefined;
const isMemberSummary = member => member.links === undefined;
const isContributorSummary = contributor => contributor.links === undefined;

const fetchFromDetailIfFilmSummary = async (film, args, context, info) => {
  if (isFilmSummary(film)) {
    return context.dataSources.letterboxdAPI.getFilm(film.id).then(json => fieldResolver(json, args, context, info));
  }
  return fieldResolver(film, args, context, info);
};

const fetchFromDetailIfListSummary = async (list, args, context, info) => {
  if (isListSummary(list)) {
    return context.dataSources.letterboxdAPI.getList(list.id).then(json => fieldResolver(json, args, context, info));
  }
  return fieldResolver(list, args, context, info);
};

const fetchFromDetailIfMemberSummary = async (member, args, context, info) => {
  if (isMemberSummary(member)) {
    return context.dataSources.letterboxdAPI
      .getMember(member.id)
      .then(json => fieldResolver(json, args, context, info));
  }
  return fieldResolver(member, args, context, info);
};

const fetchFromDetailIfContributorSummary = async (contributor, args, context, info) => {
  if (isContributorSummary(contributor)) {
    return context.dataSources.letterboxdAPI
      .getContributor(contributor.id)
      .then(json => fieldResolver(json, args, context, info));
  }
  return fieldResolver(contributor, args, context, info);
};

// Resolvers

const resolvers = {
  Query: {
    films: (root, args, context) => context.dataSources.letterboxdAPI.getFilms(args),

    film: (root, args, context) => context.dataSources.letterboxdAPI.getFilm(args.id),

    filmStatistics: (root, args, context) => context.dataSources.letterboxdAPI.getFilmStatistics(args.film),

    relationshipToFilm: (root, args) =>
      request('GET', `film/${args.film}/me`, null, args.accessToken).then(res => res.json()),

    filmCollection: (root, args) => {
      let url = `film-collection/${args.id}`;

      const queryArgs = args;
      delete queryArgs.id;

      const query = queryString.stringify(queryArgs);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json());
    },

    filmMembers: (root, args) => {
      let url = `film/${args.film}/members`;

      const queryArgs = args;
      delete queryArgs.film;

      const query = queryString.stringify(queryArgs);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json());
    },

    filmAvailability: (root, args) =>
      request('GET', `film/${args.film}/availability`, null, args.accessToken)
        .then(res => res.json())
        .then(json => json.items),

    lists: (root, args, context) => context.dataSources.letterboxdAPI.getLists(args),

    list: (root, args, context) => context.dataSources.letterboxdAPI.getList(args.id),

    listStatistics: (root, args, context) => context.dataSources.letterboxdAPI.getListStatistics(args.list),

    listComments: (root, args, context) => context.dataSources.letterboxdAPI.getListComments(args.list),

    relationshipToList: (root, args) =>
      request('GET', `list/${args.list}/me`, null, args.accessToken).then(res => res.json()),

    logEntries: (root, args, context) => context.dataSources.letterboxdAPI.getLogEntries(args),

    logEntry: (root, args, context) => context.dataSources.letterboxdAPI.getLogEntry(args.id),

    reviewStatistics: (root, args, context) => context.dataSources.letterboxdAPI.getReviewStatistics(args.logEntry),

    reviewComments: (root, args, context) => context.dataSources.letterboxdAPI.getReviewComments(args.logEntry),

    relationshipToReview: (root, args) =>
      request('GET', `log-entry/${args.logEntry}/me`, null, args.accessToken).then(res => res.json()),

    generateToken: (root, args) => {
      const params = {
        username: args.username,
        password: args.password,
        grant_type: 'password',
      };

      const body = queryString.stringify(params);

      return formRequest('POST', 'auth/token', body).then(res => res.json());
    },

    usernameCheck: (root, args) => {
      let url = 'auth/username-check';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url)
        .then(res => res.json())
        .then(json => json.result);
    },

    me: (root, args) => request('GET', 'me', null, args.accessToken).then(res => res.json()),

    members: (root, args, context) => context.dataSources.letterboxdAPI.getMembers(args),

    member: (root, args, context) => context.dataSources.letterboxdAPI.getMember(args.id),

    memberStatistics: (root, args, context) => context.dataSources.letterboxdAPI.getMemberStatistics(args.member),

    memberLogEntryTags: (root, args) =>
      request('GET', `member/${args.member}/log-entry-tags`)
        .then(res => res.json())
        .then(json => json.items),

    memberListTags: (root, args) =>
      request('GET', `member/${args.member}/list-tags-2`)
        .then(res => res.json())
        .then(json => json.items),

    watchlist: (root, args) => {
      let url = `member/${args.member}/watchlist`;

      const queryArgs = args;
      delete queryArgs.member;

      const query = queryString.stringify(queryArgs);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json());
    },

    genres: (root, args, context) => context.dataSources.letterboxdAPI.getGenres(),

    services: (root, args, context) =>
      context.dataSources.letterboxdAPI.get('films/film-services').then(json => json.items),

    contributor: (root, args, context) => context.dataSources.letterboxdAPI.getContributor(args.id),

    contributions: (root, args) => {
      let url = `contributor/${args.contributor}/contributions`;

      const queryArgs = args;
      delete queryArgs.contributor;

      const query = queryString.stringify(queryArgs);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json());
    },

    search: (root, args) => {
      let url = 'search';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json());
    },
  },

  SearchItem: {
    __resolveType(searchItem) {
      return searchItem.type;
    },
  },
  Comment: {
    __resolveType(comment) {
      return comment.type;
    },
  },
  LogEntry: {
    tags: logEntry => logEntry.tags2,
  },
  Film: {
    alternativeNames: film => (film.alternativeNames === undefined ? [] : film.alternativeNames),
    backdropFocalPoint: fetchFromDetailIfFilmSummary,
    contributions: (film, args, context, info) => {
      const result = fetchFromDetailIfFilmSummary(film, args, context, info);
      if (args.type) {
        return result.then(contributions => contributions.filter(contribution => contribution.type === args.type));
      }
      return result;
    },
    description: fetchFromDetailIfFilmSummary,
    tagline: fetchFromDetailIfFilmSummary,
    genres: fetchFromDetailIfFilmSummary,
    trailer: fetchFromDetailIfFilmSummary,
    backdrop: fetchFromDetailIfFilmSummary,
    directors: film => {
      if (isFilmSummary(film)) {
        return film.directors;
      }
      const directorContributions = film.contributions.find(contribution => contribution.type === 'Director');
      if (directorContributions) {
        return directorContributions.contributors;
      }
      return [];
    },
  },
  Member: {
    backdrop: fetchFromDetailIfMemberSummary,
    bio: fetchFromDetailIfMemberSummary,
    bioLbml: fetchFromDetailIfMemberSummary,
    location: fetchFromDetailIfMemberSummary,
    website: fetchFromDetailIfMemberSummary,
    twitterUsername: fetchFromDetailIfMemberSummary,
    favoriteFilms: fetchFromDetailIfMemberSummary,
    pinnedReviews: fetchFromDetailIfMemberSummary,
    links: fetchFromDetailIfMemberSummary,
  },
  List: {
    hasEntriesWithNotes: fetchFromDetailIfListSummary,
    tags: list => {
      if (isListSummary(list)) {
        return request('GET', `list/${list.id}`)
          .then(res => res.json())
          .then(json => json.tags2);
      }
      return list.tags2;
    },
    links: fetchFromDetailIfListSummary,
    canShareOn: fetchFromDetailIfListSummary,
    sharedOn: fetchFromDetailIfListSummary,
    whenCreated: fetchFromDetailIfListSummary,
    whenPublished: fetchFromDetailIfListSummary,
  },
  Contributor: {
    characterName: contributor => {
      if (isContributorSummary(contributor)) {
        return contributor.characterName;
      }
      return null;
    },
    statistics: fetchFromDetailIfContributorSummary,
    links: fetchFromDetailIfContributorSummary,
  },
};

module.exports = { resolvers, fieldResolver };
