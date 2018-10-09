const { defaultFieldResolver } = require('graphql');

const isFilmSummary = film => film.trailer === undefined;

const fetchFromDetailIfFilmSummary = async (film, args, context, info) => {
  if (isFilmSummary(film)) {
    return context.dataSources.letterboxdAPI
      .getFilm(film.id)
      .then(json => defaultFieldResolver(json, args, context, info));
  }
  return defaultFieldResolver(film, args, context, info);
};

const resolvers = {
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
};

module.exports = { resolvers };
