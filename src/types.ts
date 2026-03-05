import type {StandardSchemaV1} from '@standard-schema/spec';
import type {Request, RequestHandler} from 'express';
import type {ParamsDictionary, Query} from 'express-serve-static-core';

type StandardSchemaBodyType<T = unknown> = StandardSchemaV1<unknown, T>;

type StandardSchemaParamsType<T extends ParamsDictionary = ParamsDictionary> = StandardSchemaV1<ParamsDictionary, T>;

type StandardSchemaQueryType<T extends Query = Query> = StandardSchemaV1<Query, T>;

type StandardInfer<T> = T extends StandardSchemaV1<infer _, infer U> ? U : never;

/**
 * Infer Params type from StandardMiddlewareObject.
 */
export type StandardParamsInfer<Z extends StandardMiddlewareObject> = Z['params'] extends StandardSchemaParamsType
	? StandardInfer<Z['params']>
	: ParamsDictionary;
/**
 * Infer Body type from StandardMiddlewareObject.
 */
export type StandardBodyInfer<Z extends StandardMiddlewareObject> = Z['body'] extends StandardSchemaBodyType ? StandardInfer<Z['body']> : unknown;
/**
 * Infer Query type from StandardMiddlewareObject.
 */
export type StandardQueryInfer<Z extends StandardMiddlewareObject> = Z['query'] extends StandardSchemaQueryType ? StandardInfer<Z['query']> : Query;

/**
 * Validate schema for ExpressJS request
 * @example
 * export const validateSchema = {
 * 	body: z.object({
 * 		name: z.string().min(1),
 * 	}),
 * } satisfies StandardMiddlewareObject;
 */
export type StandardMiddlewareObject = {
	body?: StandardSchemaBodyType;
	params?: StandardSchemaParamsType;
	query?: StandardSchemaQueryType;
};

export type StandardRequestHandlerInfer<
	T extends StandardMiddlewareObject,
	ResBody = any,
	Locals extends Record<string, any> = Record<string, any>,
> = RequestHandler<StandardParamsInfer<T>, ResBody, StandardBodyInfer<T>, StandardQueryInfer<T>, Locals>;

export type StandardRequestInfer<T extends StandardMiddlewareObject, ResBody = any, Locals extends Record<string, any> = Record<string, any>> = Request<
	StandardParamsInfer<T>,
	ResBody,
	StandardBodyInfer<T>,
	StandardQueryInfer<T>,
	Locals
>;
