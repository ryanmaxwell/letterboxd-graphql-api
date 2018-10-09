const resolvers = {
  LogEntry: {
    tags: logEntry => logEntry.tags2,
  },
};

module.exports = { resolvers };
