const { defaultFieldResolver } = require('graphql');

const isMemberSummary = member => member.links === undefined;

const fetchFromDetailIfMemberSummary = async (member, args, context, info) => {
  if (isMemberSummary(member)) {
    return context.dataSources.letterboxdAPI
      .getMember(member.id)
      .then(json => defaultFieldResolver(json, args, context, info));
  }
  return defaultFieldResolver(member, args, context, info);
};

const resolvers = {
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
};

module.exports = { resolvers };
