const { ApolloServer, makeExecutableSchema } = require('apollo-server');
const fs = require('fs');

const LetterboxdAPI = require('./src/letterboxdapi.js');
const { resolvers } = require('./src/resolvers.js');

// Server

const typeDefs = `
  ${fs.readFileSync(__dirname.concat('/src/types/schema.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/types/comment/comment.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/types/contributor/contributor.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/types/film/film.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/types/list/list.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/types/logEntry/logEntry.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/types/member/member.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/types/search/search.graphql'), 'utf8')}
`;

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({
  schema,
  dataSources: () => ({ letterboxdAPI: new LetterboxdAPI() }),
  context: ({ req }) => ({
    authHeader: req.headers.authorization,
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
