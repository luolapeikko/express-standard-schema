import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {z} from 'zod';
import {type StandardMiddlewareObject, validateRequest, validateRequestHandler} from '../src';
import {errorMiddleWare, okResponseHandler, startExpress, stopExpress} from './expressHelpers';

const headers = {'Content-Type': 'application/json'};
const url = 'http://localhost:8936';

const NativeEnum = {
	TRUE: 'true',
	FALSE: 'false',
} as const;

const sub1ValueSchema = z.enum(['sub1_1', 'sub1_2']).brand('Sub1Brand');
const sub2ValueSchema = z.enum(['sub2_1', 'sub2_2']).brand('Sub2Brand');
const allSubValueSchema = z.union([sub1ValueSchema, sub2ValueSchema]);
const allSubValueBrandSchema = z.union([sub1ValueSchema, sub2ValueSchema]).brand('AllSubBrand');

type UUID = `${string}-${string}-${string}-${string}-${string}`;

function isUUID(value: string): value is UUID {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

const uuidSchema = z.string().refine(isUUID).brand('uuid');

const stringBody = {
	body: z.string(),
} satisfies StandardMiddlewareObject;

const objectBody = {
	body: z.object({
		data: z.string().brand('data'),
	}),
} satisfies StandardMiddlewareObject;

const queryParams = {
	query: z.object({
		bliteral: z.literal('test').brand('test').optional(),
		brand: z.string().brand('brand').optional(),
		bunion: allSubValueBrandSchema.optional(),
		enum: z.enum(['true', 'false']).optional(),
		id: z.string(),
		literal: z.literal('test').optional(),
		nenum: z.enum(NativeEnum).optional(),
		refine: z
			.string()
			.refine((v) => v === ('true' as const))
			.optional(),
		sub1: sub1ValueSchema.optional(),
		union: allSubValueSchema.optional(),
		uuidSchema: uuidSchema.optional(),
	}),
} satisfies StandardMiddlewareObject;

const paramParams = {
	params: z.object({
		bliteral: z.literal('test').brand('test').optional(),
		brand: z.string().brand('brand').optional(),
		bunion: allSubValueBrandSchema.optional(),
		enum: z.enum(['true', 'false']).optional(),
		id: z.string(),
		literal: z.literal('test').optional(),
		nenum: z.enum(NativeEnum).optional(),
		refine: z
			.string()
			.refine((v) => v === ('true' as const))
			.optional(),
		sub1: sub1ValueSchema.optional(),
		union: allSubValueSchema.optional(),
		uuidSchema: uuidSchema.optional(),
	}),
} satisfies StandardMiddlewareObject;

async function expectRes(path: string, init: RequestInit, status: number, text: string) {
	const uri = new URL(`${url}/${path}`);
	const res = await fetch(uri, init);
	expect(await res.text()).toBe(text);
	expect(res.status).toBe(status);
}

describe('validateRequest', function () {
	beforeAll(async () => {
		const app = await startExpress(8936);

		app.post('/string', validateRequest(stringBody), okResponseHandler);
		app.post('/object', validateRequest(objectBody), okResponseHandler);
		app.post('/query', validateRequest(queryParams), okResponseHandler);
		app.post('/param', validateRequest(paramParams), okResponseHandler);
		app.post('/param/:id', validateRequest(paramParams), okResponseHandler);
		app.post('/all/:id', validateRequest({...queryParams, ...paramParams, ...objectBody}), okResponseHandler);

		app.post('/rstring', validateRequest(stringBody, {replace: true}), okResponseHandler);
		app.post('/robject', validateRequest(objectBody, {replace: true}), okResponseHandler);
		app.post('/rquery', validateRequest(queryParams, {replace: true}), okResponseHandler);
		app.post('/rparam', validateRequest(paramParams, {replace: true}), okResponseHandler);
		app.post('/rparam/:id', validateRequest(paramParams, {replace: true}), okResponseHandler);
		app.post('/rall/:id', validateRequest({...queryParams, ...paramParams, ...objectBody}, {replace: true}), okResponseHandler);
		app.post(
			'/handle/:id',
			validateRequestHandler(
				{
					params: z.object({id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive())}),
					query: z.object({
						id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive()),
					}),
					body: z
						.object({
							data: z.string(),
						})
						.optional(),
				},
				(req, res) => {
					res.status(200).json({paramParams: req.params, queryParams: req.query});
				},
			),
		);
		app.post(
			'/throws/:id',
			validateRequestHandler(
				{
					params: z.object({id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive())}),
					query: z.object({
						id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive()),
					}),
					body: z
						.object({
							data: z.string(),
						})
						.optional(),
				},
				(_req, _res) => {
					throw new Error('Test error');
				},
			),
		);
		app.post(
			'/nexterror/:id',
			validateRequestHandler(
				{
					params: z.object({id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive())}),
					query: z.object({
						id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive()),
					}),
					body: z
						.object({
							data: z.string(),
						})
						.optional(),
				},
				(_req, _res, next) => {
					next(new Error('Test error'));
				},
			),
		);
		app.post(
			'/dualerr/:id',
			validateRequestHandler(
				{
					params: z.object({id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive())}),
					query: z.object({
						id: z.string().regex(/^\d+$/, 'Invalid number string').transform(Number).pipe(z.number().int().positive()),
					}),
					body: z
						.object({
							data: z.string(),
						})
						.optional(),
				},
				(_req, _res, next) => {
					const err = new Error('Test error');
					next(err);
					throw err;
				},
			),
		);
		app.post(
			'/clean',
			validateRequestHandler({}, (_req, res) => {
				res.end();
			}),
		);
		app.use(errorMiddleWare);
	});
	describe('errors', function () {
		it('should have error from string validation', async function () {
			await expectRes(
				'string',
				{method: 'POST', body: JSON.stringify({}), headers},
				400,
				`ValidateRequestError:path 'body' Invalid input: expected string, received object`,
			);
		});
		it('should build error from object validation', async function () {
			await expectRes(
				'object',
				{method: 'POST', body: JSON.stringify({}), headers},
				400,
				`ValidateRequestError:path 'body.data' Invalid input: expected string, received undefined`,
			);
		});
		it('should build error from query validation', async function () {
			await expectRes(
				'query',
				{method: 'POST', body: JSON.stringify({}), headers},
				400,
				`ValidateRequestError:path 'query.id' Invalid input: expected string, received undefined`,
			);
		});
		it('should build error from param validation', async function () {
			await expectRes(
				'param',
				{method: 'POST', body: JSON.stringify({}), headers},
				400,
				`ValidateRequestError:path 'params.id' Invalid input: expected string, received undefined`,
			);
		});
		it('should build error from param, query and body validation', async function () {
			await expectRes(
				'all/id',
				{method: 'POST', body: JSON.stringify({}), headers},
				400,
				`ValidateRequestError:path 'body.data' Invalid input: expected string, received undefined, \npath 'query.id' Invalid input: expected string, received undefined`,
			);
		});
	});
	describe('handleValidateRequest', function () {
		it('should transform params and query id strings to numbers', async function () {
			const uri = new URL(`${url}/handle/42?id=7`);
			const res = await fetch(uri, {method: 'POST', body: JSON.stringify({data: 'data'}), headers});
			expect(res.status).toBe(200);
			expect(await res.json()).toStrictEqual({paramParams: {id: 42}, queryParams: {id: 7}});
		});
		it('should return error when query id is missing', async function () {
			await expectRes(
				'handle/42',
				{method: 'POST', body: JSON.stringify({data: 'data'}), headers},
				400,
				`ValidateRequestError:path 'query.id' Invalid input: expected string, received undefined`,
			);
		});
		it('should return error when params id is invalid', async function () {
			await expectRes(
				'handle/abc?id=7',
				{method: 'POST', body: JSON.stringify({data: 'data'}), headers},
				400,
				`ValidateRequestError:path 'params.id' Invalid number string`,
			);
		});
		it('should return error when params id is missing and query id present', async function () {
			const uri = new URL(`${url}/handle/`);
			uri.searchParams.set('id', '7');
			const res = await fetch(uri, {method: 'POST', body: JSON.stringify({data: 'data'}), headers});
			// Express won't match /handle/:id without a segment, so 404 is expected
			expect(res.status).toBe(404);
		});
	});
	describe('handleValidateRequest throws', function () {
		it('should return error when new throw', async function () {
			await expectRes('throws/7?id=7', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 500, `Error:Test error`);
		});
		it('should return error when next(err) is called', async function () {
			await expectRes('nexterror/7?id=7', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 500, `Error:Test error`);
		});
		it('should return error when both new throw and next(err) are called', async function () {
			await expectRes('dualerr/7?id=7', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 500, `Error:Test error`);
		});
	});
	describe('handleValidateRequest clean', function () {
		it('should return 200', async function () {
			await expectRes('clean', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 200, ``);
		});
	});
	describe('validated', function () {
		it('should valid response for object', async function () {
			await expectRes('object', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 200, `OK`);
		});
		it('should valid response for query', async function () {
			await expectRes('query?id=data', {method: 'POST', body: null, headers}, 200, `OK`);
		});
		it('should valid response for param', async function () {
			await expectRes('param/data', {method: 'POST', body: null, headers}, 200, `OK`);
		});
		it('should valid response for object, query and param', async function () {
			await expectRes('all/data?id=data', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 200, `OK`);
		});
		it('should valid response for object replace', async function () {
			await expectRes('robject', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 200, `OK`);
		});
		it('should valid response for query replace', async function () {
			await expectRes('rquery?id=data', {method: 'POST', body: null, headers}, 200, `OK`);
		});
		it('should valid response for param replace', async function () {
			await expectRes('rparam/data', {method: 'POST', body: null, headers}, 200, `OK`);
		});
		it('should valid response for object, query and param replace', async function () {
			await expectRes('rall/data?id=data', {method: 'POST', body: JSON.stringify({data: 'data'}), headers}, 200, `OK`);
		});
	});
	afterAll(async () => {
		await stopExpress();
	});
});
