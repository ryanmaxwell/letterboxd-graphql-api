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

const isFilmSummary = film => film.trailer === undefined;
const isListSummary = list => list.links === undefined;
const isMemberSummary = member => member.links === undefined;
const isContributorSummary = contributor => contributor.links === undefined;

const fetchFromDetailIfFilmSummary = (film, args, context, info) => {
  if (isFilmSummary(film)) {
    return request('GET', `film/${film.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return film[info.fieldName];
};

const fetchFromDetailIfListSummary = (list, args, context, info) => {
  if (isListSummary(list)) {
    return request('GET', `list/${list.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return list[info.fieldName];
};

const fetchFromDetailIfMemberSummary = (member, args, context, info) => {
  if (isMemberSummary(member)) {
    return request('GET', `member/${member.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return member[info.fieldName];
};

const fetchFromDetailIfContributorSummary = (contributor, args, context, info) => {
  if (isContributorSummary(contributor)) {
    return request('GET', `contributor/${contributor.id}`).then(res => res.json()).then(json => json[info.fieldName]);
  }
  return contributor[info.fieldName];
};

// Resolvers

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

    listComments: (root, args) => request('GET', `list/${args.list}/comments`).then(res => res.json()).then(json => json.items),

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

    reviewComments: (root, args) => request('GET', `log-entry/${args.logEntry}/comments`).then(res => res.json()).then(json => json.items),

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

    usernameCheck: (root, args) => {
      let url = 'auth/username-check';

      const query = queryString.stringify(args);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.result);
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

    memberStatistics: (root, args) => request('GET', `member/${args.member}/statistics`).then(res => res.json()),

    memberLogEntryTags: (root, args) => request('GET', `member/${args.member}/log-entry-tags`).then(res => res.json()).then(json => json.items),

    memberListTags: (root, args) => request('GET', `member/${args.member}/list-tags-2`).then(res => res.json()).then(json => json.items),

    watchlist: (root, args) => {
      let url = `member/${args.member}/watchlist`;

      const queryArgs = args;
      delete queryArgs.member;

      const query = queryString.stringify(queryArgs);
      if (query) {
        url += `?${query}`;
      }

      return request('GET', url).then(res => res.json()).then(json => json.items);
    },

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
    genres: fetchFromDetailIfFilmSummary,
    trailer: fetchFromDetailIfFilmSummary,
    backdrop: fetchFromDetailIfFilmSummary,
    directors: (film) => {
      if (isFilmSummary(film)) {
        return film.directors;
      }
      return film.contributions.filter(contribution => contribution.type === 'Director').contributors;
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
    tags: (list) => {
      if (isListSummary(list)) {
        return request('GET', `list/${list.id}`).then(res => res.json()).then(json => json.tags2);
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
    characterName: (contributor) => {
      if (isContributorSummary(contributor)) {
        return contributor.characterName;
      }
      return null;
    },
    statistics: fetchFromDetailIfContributorSummary,
    links: fetchFromDetailIfContributorSummary,
  },
};

// Server

const typeDefs = gql`${fs.readFileSync(__dirname.concat('/src/schema.graphql'), 'utf8')}`;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
