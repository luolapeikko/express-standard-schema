import type {StandardSchemaV1} from '@standard-schema/spec';
import type {RequestHandler} from 'express';
import type {StandardBodyInfer, StandardMiddlewareObject, StandardParamsInfer, StandardQueryInfer} from './types';

export type ValidateOptions = {
	/** Replace Request values with validated values */
	replace?: boolean;
};

async function validateData<T>(schema: StandardSchemaV1<unknown, T>, data: any, path: string): Promise<T> {
	const res = await schema['~standard'].validate(data);
	if (res.issues) {
		throw new ValidateRequestError(res.issues, path);
	}
	return res.value;
}

export class ValidateRequestError extends TypeError {
	public issues: readonly StandardSchemaV1.Issue[];
	public constructor(issues: readonly StandardSchemaV1.Issue[], path: string) {
		super(issues.map((issue) => (issue.path ? `path '${path}.${issue.path.join('.')}' ${issue.message}` : `path: '${path}' ${issue.message}`)).join(', \n'));
		this.name = 'ValidateRequestError';
		this.issues = issues;
	}
}

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
	{replace}: ValidateOptions = {replace: false},
): RequestHandler<StandardParamsInfer<Z>, any, StandardBodyInfer<Z>, StandardQueryInfer<Z>> {
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: later
	return async function (req, _res, next) {
		try {
			if (schema.body) {
				const res = await validateData(schema.body, req.body, 'body');
				if (replace) {
					req.body = res as StandardBodyInfer<Z>;
				}
			}
			if (schema.params) {
				const res = await validateData(schema.params, req.params, 'params');
				if (replace) {
					req.params = res as StandardParamsInfer<Z>;
				}
			}
			if (schema.query) {
				const res = await validateData(schema.query, req.query, 'query');
				if (replace) {
					// patch values to current query object (instance)
					Object.assign(req.query, res as StandardQueryInfer<Z>);
				}
			}
			return next();
		} catch (error) {
			return next(error);
		}
	};
}
