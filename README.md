# server

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

### /

Method: POST

Request Body:

```js
{
  systemPrompt: // your system prompt,
  userPrompt: // your user prompt
}
```

Fetch example

```js

```
