# @luolapeikko/express-standard-schema

[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![npm version](https://badge.fury.io/js/@luolapeikko%2Fexpress-standard-schema.svg)](https://badge.fury.io/js/@luolapeikko%2Fexpress-standard-schema)
[![Maintainability](https://qlty.sh/gh/luolapeikko/projects/express-standard-schema/maintainability.svg)](https://qlty.sh/gh/luolapeikko/projects/express-standard-schema)
[![Code Coverage](https://qlty.sh/gh/luolapeikko/projects/express-standard-schema/coverage.svg)](https://qlty.sh/gh/luolapeikko/projects/express-standard-schema)
[![CI/CD](https://github.com/luolapeikko/express-standard-schema/actions/workflows/main.yml/badge.svg)](https://github.com/luolapeikko/express-standard-schema/actions/workflows/main.yml)

ExpressJS [Standard Schema](https://standardschema.dev/) middleware for request validation.

- Seamlessly integrates with ExpressJS error middleware by passing a `ValidateRequestError` instance.
- Fully compatible with [Standard Schema](https://standardschema.dev/) libraries like Zod, ArkType, Valibot, and others.
- Provides `StandardMiddlewareObject` helper TypeScript type for the `satisfies` operator, a structured type for defining request validation schemas.
- Offers `StandardRequestInfer` and `StandardRequestHandlerInfer` for automatic type inference.

## Install

```bash
npm i express @luolapeikko/express-standard-schema
npm i @types/express @types/express-serve-static-core @standard-schema/spec --save-dev
```

## Usage

```typescript
import { Router, type ErrorRequestHandler } from "express";
import { z } from "zod";
import {
	validateRequest,
	ValidateRequestError,
	type StandardMiddlewareObject,
	type StandardRequestInfer,
	type StandardRequestHandlerInfer,
} from "@luolapeikko/express-standard-schema";

const router = Router();

const demoRequestSchema = {
	params: z.object({
		id: z.string(),
	}),
	query: z.object({
		filter: z.string().optional(),
	}),
	body: z.object({
		name: z.string().min(3).max(255),
		email: z.string().email(),
	}),
} satisfies StandardMiddlewareObject;

// Infer the Request type only
type DemoRequest = StandardRequestInfer<typeof demoRequestSchema>;

// Infer the RequestHandler type
type DemoRequestHandler = StandardRequestHandlerInfer<typeof demoRequestSchema>;

const handleDemo: DemoRequestHandler = (req, res) => {
	// req.params.id, req.query.filter, and req.body.name are now typed!
	res.status(200).send("OK");
};

// Apply validation to a route
router.put("/user/:id", validateRequest(demoRequestSchema), handleDemo);

// Example Error Middleware
export const errorMiddleware: ErrorRequestHandler = (err, _req, res, next) => {
	if (err instanceof ValidateRequestError) {
		res.status(400).send(`Validation Failed: ${err.message}`);
		// You can also access err.issues for detailed validation errors
		return;
	}
	// handle other errors
};
```

## Advanced request handler setup

```typescript
app.post(
  '/handle/:id',
  validateRequestHandler(
    {
      params: z.object({id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive())}),
      query: z.object({
        id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive()),
      }),
    },
    (req, res, next) => {
      res.params.id; // inferred as number
      res.query.id; // inferred as number
      // ...
    },
  ),
);
```


## Advanced type customization

You can extend the inference types to work with your own custom `Request` and `RequestHandler` types for even more flexibility.

```typescript
import type {
  StandardMiddlewareObject,
  StandardParamsInfer,
  StandardBodyInfer,
  StandardQueryInfer,
} from "@luolapeikko/express-standard-schema";

// Integrate Standard Schema inference into your custom Request type.
export type CustomStandardRequest<
  T extends StandardMiddlewareObject,
  ResBody = any,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> = MyBaseRequest<
  StandardParamsInfer<T>,
  ResBody,
  StandardBodyInfer<T>,
  StandardQueryInfer<T>,
  Locals
>;

type DemoRequest = CustomStandardRequest<typeof demoRequestSchema>;

// build RequestHandler type which uses CustomStandardRequest
export type CustomStandardRequestHandler<
  T extends StandardMiddlewareObject,
  ResBody = any,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> = (
  req: CustomStandardRequest<T, ResBody, Locals & LocalsTokenPayload>,
  res: Response<ResBody, Locals & LocalsTokenPayload>,
  next: NextFunction,
) => void;

type DemoRequestHandler = CustomStandardRequestHandler<
  typeof demoRequestSchema
>;
````
