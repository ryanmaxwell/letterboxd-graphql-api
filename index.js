const { ApolloServer, makeExecutableSchema } = require('apollo-server');
const fs = require('fs');

const LetterboxdAPI = require('./src/letterboxdapi.js');
const { resolvers, fieldResolver } = require('./src/resolvers.js');

// Server

const typeDefs = `
  ${fs.readFileSync(__dirname.concat('/src/schema/schema.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/schema/comment.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/schema/contributor.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/schema/film.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/schema/list.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/schema/logEntry.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/schema/member.graphql'), 'utf8')}
  ${fs.readFileSync(__dirname.concat('/src/schema/search.graphql'), 'utf8')}
`;

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const server = new ApolloServer({
  schema,
  fieldResolver,
  dataSources: () => ({ letterboxdAPI: new LetterboxdAPI() }),
  context: ({ req }) => ({
    authHeader: req.headers.authorization,
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
