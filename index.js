const { ApolloServer, makeExecutableSchema } = require('apollo-server');
const { transpileSchema } = require('graphql-s2s').graphqls2s;
const fs = require('fs');

const LetterboxdAPI = require('./src/letterboxdapi.js');
const { resolvers, fieldResolver } = require('./src/resolvers.js');

// Server

const rawSchema = `
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
  typeDefs: transpileSchema(rawSchema),
  resolvers,
});

const server = new ApolloServer({
  schema,
  fieldResolver,
  dataSources: () => ({ letterboxdAPI: new LetterboxdAPI() }),
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
