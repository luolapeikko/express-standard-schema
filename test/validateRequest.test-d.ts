import type {Request} from 'express';
import type {ParamsDictionary, Query} from 'express-serve-static-core';
import {describe, expectTypeOf, it} from 'vitest';
import {z} from 'zod';
import type {StandardMiddlewareObject, StandardRequestHandlerInfer, StandardRequestInfer} from '../src/types';

const bodyObject = {
	body: z.object({
		name: z.string(),
	}),
} satisfies StandardMiddlewareObject;

const queryObject = {
	query: z.object({
		name: z.string(),
	}),
} satisfies StandardMiddlewareObject;

const paramsObject = {
	params: z.object({
		name: z.string(),
	}),
} satisfies StandardMiddlewareObject;

describe('validateRequest types', () => {
	describe('StandardRequestHandlerInfer', () => {
		it('should infer body type', () => {
			type BodyRequest = Request<ParamsDictionary, any, {name: string}, Query, Record<string, any>>;
			expectTypeOf<StandardRequestHandlerInfer<typeof bodyObject>>().parameter(0).toEqualTypeOf<BodyRequest>();
		});
		it('should infer query type', () => {
			type QueryRequest = Request<ParamsDictionary, any, unknown, {name: string}, Record<string, any>>;
			expectTypeOf<StandardRequestHandlerInfer<typeof queryObject>>().parameter(0).toEqualTypeOf<QueryRequest>();
		});
		it('should infer params type', () => {
			type ParamsRequest = Request<{name: string}, any, unknown, Query, Record<string, any>>;
			expectTypeOf<StandardRequestHandlerInfer<typeof paramsObject>>().parameter(0).toEqualTypeOf<ParamsRequest>();
		});
	});

	describe('StandardInferRequest', () => {
		it('should infer complete Request type from bodyObject', () => {
			expectTypeOf<StandardRequestInfer<typeof bodyObject>>().toEqualTypeOf<Request<ParamsDictionary, any, {name: string}, Query, Record<string, any>>>();
		});

		it('should infer complete Request type from queryObject', () => {
			expectTypeOf<StandardRequestInfer<typeof queryObject>>().toEqualTypeOf<Request<ParamsDictionary, any, unknown, {name: string}, Record<string, any>>>();
		});

		it('should infer complete Request type from paramsObject', () => {
			expectTypeOf<StandardRequestInfer<typeof paramsObject>>().toEqualTypeOf<Request<{name: string}, any, unknown, Query, Record<string, any>>>();
		});
	});
});
