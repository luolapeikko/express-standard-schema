import type {StandardSchemaV1} from '@standard-schema/spec';
import {describe, expect, it} from 'vitest';
import {ValidateRequestError} from '../src/ValidateRequestError';

describe('ValidateRequestError', () => {
	it('should set error name, issues and formatted message', () => {
		const issues = [
			{message: 'is required', path: ['body', 'name']},
			{message: 'must be uuid', path: ['params', 'id']},
		] as StandardSchemaV1.Issue[];

		const error = new ValidateRequestError(issues);

		expect(error.name).toBe('ValidateRequestError');
		expect(error.issues).toEqual(issues);
		expect(error.message).toContain("path 'body.name' is required");
		expect(error.message).toContain("path 'params.id' must be uuid");
	});

	it('should convert issues to a grouped json object by path', () => {
		const issues = [
			{message: 'must be string', path: ['body', 'name']},
			{message: 'must have at least 3 chars', path: ['body', 'name']},
			{message: 'missing', path: ['query', 'id']},
			{message: 'unknown failure'},
		] as StandardSchemaV1.Issue[];

		const error = new ValidateRequestError(issues);

		expect(error.toJSON()).toEqual({
			'body.name': ['must be string', 'must have at least 3 chars'],
			'query.id': ['missing'],
			unknown: ['unknown failure'],
		});
	});
});
