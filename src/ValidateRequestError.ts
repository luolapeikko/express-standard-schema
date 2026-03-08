import type {StandardSchemaV1} from '@standard-schema/spec';

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
	private static formatIssues(issues: readonly StandardSchemaV1.Issue[]): string {
		return issues.map((issue) => (issue.path ? `path '${issue.path.join('.')}' ${issue.message}` : `path: '${issue.message}`)).join(', \n');
	}

	public issues: readonly StandardSchemaV1.Issue[];

	public constructor(issues: readonly StandardSchemaV1.Issue[]) {
		super(ValidateRequestError.formatIssues(issues));
		this.name = 'ValidateRequestError';
		this.issues = issues;
	}

	/**
	 * Get formatted errors as JSON for API responses.
	 * @example
	 * const error = new ValidateRequestError([{path: ['body', 'name'], message: 'Required'}]);
	 * const payload = error.toJSON();
	 * // { 'body.name': ['Required'] }
	 */
	public toJSON(): Record<string, string[]> {
		const errors: Record<string, string[]> = {};
		for (const issue of this.issues) {
			const path = issue.path?.join('.') ?? 'unknown';
			if (!errors[path]) {
				errors[path] = [];
			}
			// Example shape: { 'body.name': ['Required'] }
			errors[path].push(issue.message);
		}
		return errors;
	}
}
