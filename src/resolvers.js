const { merge } = require('lodash');

const { resolvers: commentResolvers } = require('./types/comment/comment.js');
const { resolvers: contributorResolvers } = require('./types/contributor/contributor.js');
const { resolvers: filmResolvers } = require('./types/film/film.js');
const { resolvers: logEntryResolvers } = require('./types/logEntry/logEntry.js');
const { resolvers: listResolvers } = require('./types/list/list.js');
const { resolvers: memberResolvers } = require('./types/member/member.js');
const { resolvers: searchResolvers } = require('./types/search/search.js');

const queryResolvers = {
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
};

const resolvers = merge(
  queryResolvers,
  commentResolvers,
  contributorResolvers,
  filmResolvers,
  logEntryResolvers,
  listResolvers,
  memberResolvers,
  searchResolvers
);

module.exports = { resolvers };
