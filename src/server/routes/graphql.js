import express from "express";
const router = express.Router();
import { ApolloServer } from "apollo-server-express";
import { makeExecutableSchema, addMockFunctionsToSchema } from "graphql-tools";

import mocks from "../api/mocks";
import { contextForRequest } from "../contexts";
import { config } from "../../config";
import { resolvers } from "../api/schema";
import { schema } from "../../api/schema";

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  allowUndefinedInResolve: false
});

addMockFunctionsToSchema({
  schema: executableSchema,
  mocks,
  preserveResolvers: true
});

const server = new ApolloServer({
  schema: executableSchema,
  debug: !config.isProduction,
  introspection: !config.isProduction,
  playground: !config.isProduction,
  context: ({ req, res }) => ({
    user: req.user,
    ...contextForRequest(req)
  })
});

server.applyMiddleware({
  app: router,
  path: "/graphql"
});

export default router;
