# async-request-handler

Safe async RequestHandler to catch Promise rejection

[![Node.js CI](https://github.com/kawanet/async-request-handler/workflows/Node.js%20CI/badge.svg?branch=master)](https://github.com/kawanet/async-request-handler/actions/)
[![npm version](https://badge.fury.io/js/async-request-handler.svg)](https://www.npmjs.com/package/async-request-handler)

## SYNOPSIS

```js
import express from "express";
import {ASYNC, CATCH, IF} from "async-request-handler";

const app = express();

app.use(ASYNC(async (req, res, next) => { /* RequestHandler */ }));

app.use(CATCH(async (err, req, res, next) => { /* ErrorRequestHandler */ }));

app.use(ASYNC(
    async (req, res, next) => { throw new Error("Error!") },
    async (err, req, res, next) => { /* ErrorRequestHandler */ }
));

app.use(IF(
    async (req) => (req.query.foo === "bar"),
    async (req, res, next) => { /* RequestHandler for true */ },
    async (req, res, next) => { /* RequestHandler for false */ }
));
```

See TypeScript declaration
[async-request-handler.d.ts](https://github.com/kawanet/async-request-handler/blob/master/types/async-request-handler.d.ts)
for more detail.

## SEE ALSO

- https://github.com/kawanet/async-request-handler
- https://github.com/kawanet/express-intercept

## LICENSE

The MIT License (MIT)

Copyright (c) 2020-2024 Yusuke Kawasaki

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
