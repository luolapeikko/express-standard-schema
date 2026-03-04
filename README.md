# @luolapeikko/express-standard-schema

ExpressJS Standards Validation Middleware

- uses ExpressJS error middleware handling and passing ValidateRequestError instance to error middleware.
- StandardMiddlewareObject Object builder type for Request validation.
- StandardRequestInfer and StandardRequestHandlerInfer types to build Request or RequestHandler types from type of StandardMiddlewareObject.
- Optionally can use TS satisfies to help build schema object.

## install

```bash
npm i @luolapeikko/express-standard-schema
```

## usage

```typescript
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
    password: z.string().min(8).max(255),
  }),
} satisfies StandardMiddlewareObject;

// build RequestHandler type
type DemoRequestHandler = StandardRequestInfer<typeof demoRequestSchema>;
// or just Request
type DemoRequest = StandardRequestHandlerInfer<typeof demoRequestSchema>;

// in router
route.put("/:id", validateRequest(demoRequestSchema), handleDemo);

// in error middleware
export const errorMiddleWare: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof ValidateRequestError) {
    res.status(400).send(`ValidateRequestError:${err.message}`);
    // or build from err.issues
  }
  //
};
```

## Extend Request and RequestHandler types with already customized Request type.

```typescript
// build Request type which uses CustomRequest and StandardMiddlewareObject
export type CustomStandardRequest<
  T extends StandardMiddlewareObject,
  ResBody = any,
  Locals extends Record<string, unknown> = Record<string, unknown>,
> = CustomRequest<
  StandardParamsInfer<T>,
  ResBody,
  StandardBodyInfer<T>,
  StandardQueryInfer<T>,
  Locals
>;

// type DemoRequest = CustomStandardRequest<typeof demoRequestSchema>;

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

// type DemoRequestHandler = CustomStandardRequestHandler<typeof demoRequestSchema>;
```
