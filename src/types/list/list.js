const { defaultFieldResolver } = require('graphql');

const isListSummary = list => list.links === undefined;

const fetchFromDetailIfListSummary = async (list, args, context, info) => {
  if (isListSummary(list)) {
    return context.dataSources.letterboxdAPI
      .getList(list.id)
      .then(json => defaultFieldResolver(json, args, context, info));
  }
  return defaultFieldResolver(list, args, context, info);
};

const resolvers = {
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
};

module.exports = { resolvers };
