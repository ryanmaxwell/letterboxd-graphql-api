const { defaultFieldResolver } = require('graphql');

const isContributorSummary = contributor => contributor.links === undefined;

const fetchFromDetailIfContributorSummary = async (contributor, args, context, info) => {
  if (isContributorSummary(contributor)) {
    return context.dataSources.letterboxdAPI
      .getContributor(contributor.id)
      .then(json => defaultFieldResolver(json, args, context, info));
  }
  return defaultFieldResolver(contributor, args, context, info);
};

const resolvers = {
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

module.exports = { resolvers };
