# ChatITP Server

This repository includes code for the Chat ITP server.

## Setup

For development, clone this repository and run the following commands in the repository's directory:

```
npm install
npm run dev
```

This will start the development server, which automatically restarts after file changes.

To compile the server for production, run:

```
npm run build
```

After building, the production server can be started by running:

```
npm start
```

## API Endpoints

### `POST /`

Request Body:

```js
{
  systemPrompt: // your system prompt,
  userPrompt: // your user prompt
}
```

Fetch example:

```js
fetch("<domain>/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    systemPrompt: "You are a helpful assistant.",
    userPrompt: "What is 2 + 2?",
  }),
});
```

Response JSON:

```json
{
  "success": true,
  "content": "The answer to 2 + 2 is 4."
}
```

### `GET /db/getPaginated`

Example:

```js
fetch("<domain>/db/getPaginated?limit=20&offset=10");
```

#### Queries

**limit**: Number of projects to get

**offset**: The starting index

### `GET /db/projectCount`

Example:

```js
fetch("<domain>/db/projectCount");
```

Response JSON:

```json
{ "count": 50 }
```
