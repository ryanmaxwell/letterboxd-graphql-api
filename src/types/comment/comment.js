const resolvers = {
  Comment: {
    __resolveType(comment) {
      return comment.type;
    },
  },
};

module.exports = { resolvers };
