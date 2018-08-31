const { ApolloServer, gql } = require('apollo-server');
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');
const uuid = require('uuid-random');
const queryString = require('query-string');

const {
  LETTERBOXD_API_KEY,
  LETTERBOXD_API_SECRET,
} = process.env;

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

  const signature = crypto.createHmac('sha256', LETTERBOXD_API_SECRET).update(saltedString).digest('hex');

  url += `&signature=${signature}`;

  console.log(url);

  return url;
};

const request = (method, path, body, accessToken) => {
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

const formRequest = (method, path, body) => {
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

const isFilmSummary = obj => obj.trailer === undefined;
const isListSummary = obj => obj.links === undefined;
const isMemberSummary = obj => obj.links === undefined;
const isContributorSummary = obj => obj.links === undefined;

const fetchFromDetailIfFilmSummary = (obj, args, context, info) => {
  if (isFilmSummary(obj)) {
    return request('GET', `film/${obj.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return obj[info.fieldName];
};

const fetchFromDetailIfListSummary = (obj, args, context, info) => {
  if (isListSummary(obj)) {
    return request('GET', `list/${obj.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return obj[info.fieldName];
};

const fetchFromDetailIfMemberSummary = (obj, args, context, info) => {
  if (isMemberSummary(obj)) {
    return request('GET', `member/${obj.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return obj[info.fieldName];
};

const fetchFromDetailIfContributorSummary = (obj, args, context, info) => {
  if (isContributorSummary(obj)) {
    return request('GET', `contributor/${obj.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return obj[info.fieldName];
};

const resolvers = {
  Query: {
    films: (root, args) => {
      let url = 'films';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },

    film: (root, args) => request('GET', `film/${args.id}`).then(res => res.json()),

    filmStatistics: (root, args) => request('GET', `film/${args.film}/statistics`).then(res => res.json()),

    relationshipToFilm: (root, args) => request('GET', `film/${args.film}/me`, null, args.accessToken).then(res => res.json()),

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

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },

    filmAvailability: (root, args) => request('GET', `film/${args.film}/availability`, null, args.accessToken).then(res => res.json()).then(json => json.items),

    lists: (root, args) => {
      let url = 'lists';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },

    list: (root, args) => request('GET', `list/${args.id}`).then(res => res.json()),

    listStatistics: (root, args) => request('GET', `list/${args.list}/statistics`).then(res => res.json()),

    relationshipToList: (root, args) => request('GET', `list/${args.list}/me`, null, args.accessToken).then(res => res.json()),

    logEntries: (root, args) => {
      let url = 'log-entries';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },
    logEntry: (root, args) => request('GET', `log-entry/${args.id}`).then(res => res.json()),

    reviewStatistics: (root, args) => request('GET', `log-entry/${args.logEntry}/statistics`).then(res => res.json()),

    relationshipToReview: (root, args) => request('GET', `log-entry/${args.logEntry}/me`, null, args.accessToken).then(res => res.json()),

    generateToken: (root, args) => {
      const params = {
        username: args.username,
        password: args.password,
        grant_type: 'password',
      };

      const body = queryString.stringify(params);

      return formRequest('POST', 'auth/token', body).then(res => res.json());
    },

    me: (root, args) => request('GET', 'me', null, args.accessToken).then(res => res.json()),

    members: (root, args) => {
      let url = 'members';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },
    member: (root, args) => request('GET', `member/${args.id}`).then(res => res.json()),

    genres: () => request('GET', 'films/genres').then(res => res.json()).then(json => json.items),

    services: () => request('GET', 'films/film-services').then(res => res.json()).then(json => json.items),

    contributor: (root, args) => request('GET', `contributor/${args.id}`).then(res => res.json()),

    contributions: (root, args) => {
      let url = `contributor/${args.contributor}/contributions`;

      const queryArgs = args;
      delete queryArgs.contributor;

      const query = queryString.stringify(queryArgs);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },

    search: (root, args) => {
      let url = 'search';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },
  },

  SearchItem: {
    __resolveType(obj) {
      return obj.type;
    },
  },
  LogEntry: {
    tags: obj => obj.tags2,
  },
  Film: {
    alternativeNames: obj => (obj.alternativeNames === undefined ? [] : obj.alternativeNames),
    backdropFocalPoint: fetchFromDetailIfFilmSummary,
    contributions: (obj, args, context, info) => {
      const result = fetchFromDetailIfFilmSummary(obj, args, context, info);
      if (args.type) {
        return result.then(contributions => contributions.filter(contribution => contribution.type === args.type));
      }
      return result;
    },
    genres: fetchFromDetailIfFilmSummary,
    trailer: fetchFromDetailIfFilmSummary,
    backdrop: fetchFromDetailIfFilmSummary,
    directors: (obj) => {
      if (isFilmSummary(obj)) {
        return obj.directors;
      }
      return obj.contributions.filter(contribution => contribution.type === 'Director').contributors;
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
    tags: (obj) => {
      if (isListSummary(obj)) {
        return request('GET', `list/${obj.id}`).then(res => res.json()).then(json => json.tags2);
      }
      return obj.tags2;
    },
    links: fetchFromDetailIfListSummary,
    canShareOn: fetchFromDetailIfListSummary,
    sharedOn: fetchFromDetailIfListSummary,
    whenCreated: fetchFromDetailIfListSummary,
    whenPublished: fetchFromDetailIfListSummary,
  },
  Contributor: {
    characterName: (obj) => {
      if (isContributorSummary(obj)) {
        return obj.characterName;
      }
      return null;
    },
    statistics: fetchFromDetailIfContributorSummary,
    links: fetchFromDetailIfContributorSummary,
  },
};

const typeDefs = gql`${fs.readFileSync(__dirname.concat('/src/schema.graphql'), 'utf8')}`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
