# letterboxd-graphql-api

A semi-complete GraphQL wrapper for the Letterboxd.com API. A work in progress.

## Prerequisites

- An API Key/Secret for [letterboxd.com](https://letterboxd.com)
- Node.js

## Setup

- Declare your API Key/Secret as environment variables, e.g. in your `~/.bash_profile`:

```
export LETTERBOXD_API_KEY="MY_KEY"
export LETTERBOXD_API_SECRET="MY_SECRET"
```

- Clone this repo
- Run `npm install`
- Run `node index.js`
- Open your browser to `http://localhost:4000` to browse the schema and perform queries in the playground

## Status

DONE

- Get Endpoints

TODO

- Activity
- News
- Mutation Endpoints (POST/PATCH/PUT)
- Film Contributions/List Entries response additional types
- Date types
- Error handling

ARCHITECTURE

- nesting more requests under top level without performing initial request

NOT DOING
Member/review/list report
Forgotten password request
Member validation request

## More Info

- [Letterboxd API Docs](http://api-docs.letterboxd.com)
- [Apollo GraphQL](https://www.apollographql.com/server)
