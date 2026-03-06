import type {StandardSchemaV1} from '@standard-schema/spec';
import type {RequestHandler} from 'express';
import type {StandardBodyInfer, StandardMiddlewareObject, StandardParamsInfer, StandardQueryInfer} from './types';

async function validateData<T>(
	schema: StandardSchemaV1<unknown, T>,
	data: unknown,
	path: string,
	issues: StandardSchemaV1.Issue[],
): Promise<StandardSchemaV1.Result<T>> {
	const res = await schema['~standard'].validate(data);
	if (res.issues) {
		issues.push(...res.issues.map((issue) => ({...issue, path: [path, ...(issue.path ?? [])]})));
	}
	return res;
}

/**
 * Error thrown when validation fails
 * @since 0.0.1
 * @example
 * export const errorMiddleware: ErrorRequestHandler = (err, _req, res, next) => {
 *   if (err instanceof ValidateRequestError)
 *     res.status(400).send(`Validation Failed: ${err.message}`);
 *     // You can also access err.issues for detailed validation errors
 *     return;
 *   }
 *   // handle other errors
 * };
 */
export class ValidateRequestError extends TypeError {
	public issues: readonly StandardSchemaV1.Issue[];
	public constructor(issues: readonly StandardSchemaV1.Issue[]) {
		super(issues.map((issue) => (issue.path ? `path '${issue.path.join('.')}' ${issue.message}` : `path: '${issue.message}`)).join(', \n'));
		this.name = 'ValidateRequestError';
		this.issues = issues;
	}
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
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: later
	return async function (req, _res, next) {
		const issues: StandardSchemaV1.Issue[] = [];
		try {
			if (schema.body) {
				const result = await validateData(schema.body, req.body, 'body', issues);
				if (replace && !result.issues) {
					req.body = result.value as StandardBodyInfer<Z>;
				}
			}
			if (schema.params) {
				const result = await validateData(schema.params, req.params, 'params', issues);
				if (replace && !result.issues) {
					req.params = result.value as StandardParamsInfer<Z>;
				}
			}
			if (schema.query) {
				const result = await validateData(schema.query, req.query, 'query', issues);
				if (replace && !result.issues) {
					Object.assign(req.query, result.value as StandardQueryInfer<Z>);
				}
			}
			if (issues.length > 0) {
				return next(new ValidateRequestError(issues));
			}
			return next();
		} catch (error) {
			/* c8 ignore start */
			return next(error); // just safety net for express 4
			/* c8 ignore stop */
		}
	};
}
