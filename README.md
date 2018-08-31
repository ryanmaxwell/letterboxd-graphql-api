# letterboxd-graphql-api

A semi-complete GraphQL wrapper for the Letterboxd.com API. A work in progress.

## Prerequisites
- An API Key/Secret for [letterboxd.com](https://letterboxd.com)
- Node.js

## Setup

- Declare your API Key/Secre as environment variables, e.g. in your `bash_profile`:

```
export LETTERBOXD_API_KEY="MY_KEY"
export LETTERBOXD_API_SECRET="MY_SECRET"
```

- Clone this repo
- Run `npm install`
- Run `node index.js`
- Open the playground at `http://localhost:4000` to browse the schema and perform queries

## More Info
- [Letterboxd API Docs](http://api-docs.letterboxd.com)
- [Apollo GraphQL](https://www.apollographql.com/server)