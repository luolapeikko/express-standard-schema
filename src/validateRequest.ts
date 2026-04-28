import type {StandardSchemaV1} from '@standard-schema/spec';
import type {Request, RequestHandler} from 'express';
import type {StandardBodyInfer, StandardMiddlewareObject, StandardParamsInfer, StandardQueryInfer} from './types';
import {ValidateRequestError} from './ValidateRequestError';

function addTargetPath(issues: readonly StandardSchemaV1.Issue[], target: string): StandardSchemaV1.Issue[] {
	return issues.map((issue) => ({...issue, path: [target, ...(issue.path ?? [])]}));
}

async function validateTarget<T>(
	schema: StandardSchemaV1<unknown, T> | undefined,
	data: unknown,
	target: string,
	issues: StandardSchemaV1.Issue[],
): Promise<T | undefined> {
	if (!schema) {
		return undefined;
	}
	const res = await schema['~standard'].validate(data);
	if (res.issues) {
		issues.push(...addTargetPath(res.issues, target));
	}
	return res.issues ? undefined : res.value;
}

/**
 * Options for validateRequest
 * @since 0.0.1
 */
export type ValidateOptions = {
	/** Replace Request values with validated values */
	replace?: boolean;
};

/**
 * Validate schema for ExpressJS request
 * @since 0.0.1
 * @template Z - StandardMiddlewareObject
 * @param schema - Schema to validate
 * @param options - Options for validateRequest
 * @returns {RequestHandler<StandardParamsInfer<Z>, any, StandardBodyInfer<Z>, StandardQueryInfer<Z>>} RequestHandler
 * @example
 * const demoRequestSchema = {
 *   body: z.object({
 *     hello: z.string(),
 *   }),
 * } satisfies StandardMiddlewareObject;
 * type DemoRequestHandler = StandardRequestHandlerInfer<typeof demoRequestSchema>;
 *
 * const handleDemoRequest: DemoRequestHandler = (req, res) => {
 *   res.status(200).send(req.body.hello);
 * }
 *
 * route.post('/', validateRequest(demoRequestSchema), handleDemoRequest);
 */
export function validateRequest<
	ResBody = any,
	Locals extends Record<string, any> = Record<string, any>,
	Z extends StandardMiddlewareObject = StandardMiddlewareObject,
>(schema: Z, {replace = false}: ValidateOptions = {}): RequestHandler<StandardParamsInfer<Z>, ResBody, StandardBodyInfer<Z>, StandardQueryInfer<Z>, Locals> {
	return async function (req, _res, next) {
		const issues: StandardSchemaV1.Issue[] = [];
		try {
			const validatedBody = await validateTarget(schema.body, req.body, 'body', issues);
			const validatedParams = await validateTarget(schema.params, req.params, 'params', issues);
			const validatedQuery = await validateTarget(schema.query, req.query, 'query', issues);
			if (issues.length > 0) {
				return next(new ValidateRequestError(issues));
			}
			if (replace) {
				if (validatedBody !== undefined) {
					req.body = validatedBody as StandardBodyInfer<Z>;
				}
				if (validatedParams !== undefined) {
					req.params = validatedParams as StandardParamsInfer<Z>;
				}
				if (validatedQuery !== undefined) {
					Object.defineProperty(req, 'query', {value: validatedQuery, writable: true, configurable: true, enumerable: true});
				}
			}
			return next();
		} catch (error) {
			/* c8 ignore start */
			return next(error); // just safety net for express 4
			/* c8 ignore stop */
		}
	};
}

type StandardOutputInfer<T> = T extends StandardSchemaV1<infer _, infer V> ? V : never;
type StandardParamsOutInfer<Z extends StandardMiddlewareObject> = Z['params'] extends StandardSchemaV1 ? StandardOutputInfer<Z['params']> : unknown;
type StandardBodyOutInfer<Z extends StandardMiddlewareObject> = Z['body'] extends StandardSchemaV1 ? StandardOutputInfer<Z['body']> : unknown;
type StandardQueryOutInfer<Z extends StandardMiddlewareObject> = Z['query'] extends StandardSchemaV1 ? StandardOutputInfer<Z['query']> : unknown;

export type ValidatedOutputRequestHandler<
	ResBody = any,
	Locals extends Record<string, any> = Record<string, any>,
	Z extends StandardMiddlewareObject = StandardMiddlewareObject,
> = RequestHandler<StandardParamsOutInfer<Z>, ResBody, StandardBodyOutInfer<Z>, StandardQueryOutInfer<Z>, Locals>;

/**
 * Validate schema for ExpressJS request and handle the request with validated (and transformed) output type.
 * @template Z - StandardMiddlewareObject
 * @template ResBody - Response body type
 * @param schema - Schema to validate
 * @param handle - Request handler to execute after validation
 * @returns {RequestHandler<StandardParamsInfer<Z>, ResBody, StandardBodyInfer<Z>, StandardQueryInfer<Z>, Locals>} RequestHandler
 * @since v0.0.9
 * @example
 * app.get(
 *   '/handle/:id',
 *   validateRequestHandler(
 *     {
 *       params: z.object({id: z.string().transform((v) => Number(v))}),
 *       query: z.object({
 *         id: z.string().transform((v) => Number(v)),
 *       }),
 *     },
 *     (req, res, next) => {
 *       // req.params.id and req.query.id are both number type
 *     },
 *   ),
 * );
 */
export function validateRequestHandler<
	ResBody = any,
	Locals extends Record<string, any> = Record<string, any>,
	Z extends StandardMiddlewareObject = StandardMiddlewareObject,
>(
	schema: Z,
	handle: ValidatedOutputRequestHandler<ResBody, Locals, Z>,
): RequestHandler<StandardParamsInfer<Z>, ResBody, StandardBodyInfer<Z>, StandardQueryInfer<Z>, Locals> {
	return async function (req, res, next) {
		const issues: StandardSchemaV1.Issue[] = [];
		try {
			const validatedBody = await validateTarget(schema.body, req.body, 'body', issues);
			const validatedParams = await validateTarget(schema.params, req.params, 'params', issues);
			const validatedQuery = await validateTarget(schema.query, req.query, 'query', issues);
			if (issues.length > 0) {
				return next(new ValidateRequestError(issues));
			}
			if (validatedBody !== undefined) {
				req.body = validatedBody as StandardBodyInfer<Z>;
			}
			if (validatedParams !== undefined) {
				req.params = validatedParams as StandardParamsInfer<Z>;
			}
			if (validatedQuery !== undefined) {
				Object.defineProperty(req, 'query', {value: validatedQuery, writable: true, configurable: true, enumerable: true});
			}
			return await handle(req as Request<StandardParamsOutInfer<Z>, ResBody, StandardBodyOutInfer<Z>, StandardQueryOutInfer<Z>, Locals>, res, next);
		} catch (error) {
			/* c8 ignore start */
			return next(error); // just safety net for express 4
			/* c8 ignore stop */
		}
	};
}
