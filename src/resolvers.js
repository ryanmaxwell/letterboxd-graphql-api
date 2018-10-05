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

    relationshipToFilm: (root, args, context) =>
      context.dataSources.letterboxdAPI.getRelationshipToFilm(args.film, context.authHeader),

    filmCollection: (root, args, context) => {
      const filmCollectionId = args.id;
      const queryParams = args;
      delete queryParams.id;

      return context.dataSources.letterboxdAPI.getFilmCollection(filmCollectionId, queryParams);
    },

    filmMembers: (root, args, context) => {
      const filmId = args.film;
      const queryParams = args;
      delete queryParams.film;

      return context.dataSources.letterboxdAPI.getFilmMembers(filmId, queryParams);
    },

    filmAvailability: (root, args, context) =>
      context.dataSources.letterboxdAPI.getRelationshipToFilm(args.film, context.authHeader),

    lists: (root, args, context) => context.dataSources.letterboxdAPI.getLists(args),

    list: (root, args, context) => context.dataSources.letterboxdAPI.getList(args.id),

    listStatistics: (root, args, context) => context.dataSources.letterboxdAPI.getListStatistics(args.list),

    listComments: (root, args, context) => context.dataSources.letterboxdAPI.getListComments(args.list),

    relationshipToList: (root, args, context) =>
      context.dataSources.letterboxdAPI.getRelationshipToList(args.list, context.authHeader),

    logEntries: (root, args, context) => context.dataSources.letterboxdAPI.getLogEntries(args),

    logEntry: (root, args, context) => context.dataSources.letterboxdAPI.getLogEntry(args.id),

    reviewStatistics: (root, args, context) => context.dataSources.letterboxdAPI.getReviewStatistics(args.logEntry),

    reviewComments: (root, args, context) => context.dataSources.letterboxdAPI.getReviewComments(args.logEntry),

    relationshipToReview: (root, args, context) =>
      context.dataSources.letterboxdAPI.getRelationshipToReview(args.logEntry, context.authHeader),

    generateToken: (root, args, context) => context.dataSources.letterboxdAPI.getToken(args),

    me: (root, args, context) => context.dataSources.letterboxdAPI.getMe(context.authHeader),

    members: (root, args, context) => context.dataSources.letterboxdAPI.getMembers(args),

    member: (root, args, context) => context.dataSources.letterboxdAPI.getMember(args.id),

    memberStatistics: (root, args, context) => context.dataSources.letterboxdAPI.getMemberStatistics(args.member),

    memberLogEntryTags: (root, args, context) => context.dataSources.letterboxdAPI.getMemberLogEntryTags(args.member),

    memberListTags: (root, args, context) => context.dataSources.letterboxdAPI.getMemberListTags(args.member),

    watchlist: (root, args, context) => {
      const memberId = args.member;
      const queryParams = args;
      delete memberId.member;

      return context.dataSources.letterboxdAPI.getMemberWatchlist(memberId, queryParams);
    },

    genres: (root, args, context) => context.dataSources.letterboxdAPI.getGenres(),

    services: (root, args, context) => context.dataSources.letterboxdAPI.getServices(),

    contributor: (root, args, context) => context.dataSources.letterboxdAPI.getContributor(args.id),

    contributions: (root, args, context) => {
      const contributorId = args.contributor;
      const queryParams = args;
      delete queryParams.contributor;

      return context.dataSources.letterboxdAPI.getContributions(contributorId, queryParams);
    },

    search: (root, args, context) => context.dataSources.letterboxdAPI.getSearchItems(args),
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
    tags: (list, args, context) => {
      if (isListSummary(list)) {
        return context.letterboxdAPI.getList(list.id).then(json => json.tags2);
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
