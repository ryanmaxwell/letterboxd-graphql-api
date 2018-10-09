const resolvers = {
  SearchItem: {
    __resolveType(searchItem) {
      return searchItem.type;
    },
  },
};

module.exports = { resolvers };
