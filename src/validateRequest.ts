import type {StandardSchemaV1} from '@standard-schema/spec';
import type {RequestHandler} from 'express';
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
export function validateRequest<Z extends StandardMiddlewareObject>(
	schema: Z,
	{replace = false}: ValidateOptions = {},
): RequestHandler<StandardParamsInfer<Z>, any, StandardBodyInfer<Z>, StandardQueryInfer<Z>> {
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
					Object.assign(req.query, validatedQuery as StandardQueryInfer<Z>);
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
