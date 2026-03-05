import type {StandardSchemaV1} from '@standard-schema/spec';
import type {RequestHandler} from 'express';
import type {StandardBodyInfer, StandardMiddlewareObject, StandardParamsInfer, StandardQueryInfer} from './types';

async function validateData<T>(schema: StandardSchemaV1<unknown, T>, data: unknown, path: string, issues: StandardSchemaV1.Issue[]): Promise<T | undefined> {
	const res = await schema['~standard'].validate(data);
	if (res.issues) {
		issues.push(...res.issues.map((issue) => ({...issue, path: [path, ...(issue.path ?? [])]})));
		return undefined;
	}
	return res.value;
}

export class ValidateRequestError extends TypeError {
	public issues: readonly StandardSchemaV1.Issue[];
	public constructor(issues: readonly StandardSchemaV1.Issue[]) {
		super(issues.map((issue) => (issue.path ? `path '${issue.path.join('.')}' ${issue.message}` : `path: '${issue.message}`)).join(', \n'));
		this.name = 'ValidateRequestError';
		this.issues = issues;
	}
}

export type ValidateOptions = {
	/** Replace Request values with validated values */
	replace?: boolean;
};

/**
 * Validate schema for ExpressJS request
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
				const body = await validateData(schema.body, req.body, 'body', issues);
				if (body && replace) {
					req.body = body as StandardBodyInfer<Z>;
				}
			}
			if (schema.params) {
				const params = await validateData(schema.params, req.params, 'params', issues);
				if (params && replace) {
					req.params = params as StandardParamsInfer<Z>;
				}
			}
			if (schema.query) {
				const query = await validateData(schema.query, req.query, 'query', issues);
				if (query && replace) {
					Object.assign(req.query, query as StandardQueryInfer<Z>);
				}
			}
			if (issues.length > 0) {
				return next(new ValidateRequestError(issues));
			}
			return next();
		} catch (error) {
			return next(error); // just safety net for express 4
		}
	};
}
