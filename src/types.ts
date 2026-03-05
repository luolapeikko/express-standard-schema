import type {StandardSchemaV1} from '@standard-schema/spec';
import type {Request, RequestHandler} from 'express';
import type {ParamsDictionary, Query} from 'express-serve-static-core';

/** Base type for Standard Schema Body */
type StandardSchemaBodyType<T = unknown> = StandardSchemaV1<unknown, T>;

/** Base type for Standard Schema Params */
type StandardSchemaParamsType<T extends ParamsDictionary = ParamsDictionary> = StandardSchemaV1<ParamsDictionary, T>;

/** Base type for Standard Schema Query params */
type StandardSchemaQueryType<T extends Query = Query> = StandardSchemaV1<Query, T>;

/** Infer output type from StandardSchemaV1 */
type StandardOutputInfer<T> = T extends StandardSchemaV1<infer _, infer U> ? U : never;

/**
 * Infer ExpressJS Params type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.1
 * @example
 * const paramsSchema = {params: z.object({id: z.string()})} satisfies StandardMiddlewareObject;
 * type DemoParams = StandardParamsInfer<typeof paramsSchema>; // {id: string}
 */
export type StandardParamsInfer<Z extends StandardMiddlewareObject> = Z['params'] extends StandardSchemaParamsType
	? StandardOutputInfer<Z['params']>
	: ParamsDictionary;

/**
 * Infer ExpressJS Body type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.1
 * @example
 * const bodySchema = {body: z.object({name: z.string()})} satisfies StandardMiddlewareObject;
 * type DemoBody = StandardBodyInfer<typeof bodySchema>; // {name: string}
 */
export type StandardBodyInfer<Z extends StandardMiddlewareObject> = Z['body'] extends StandardSchemaBodyType ? StandardOutputInfer<Z['body']> : unknown;

/**
 * Infer ExpressJS Query type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.1
 * @example
 * const querySchema = {query: z.object({name: z.string()})} satisfies StandardMiddlewareObject;
 * type DemoQuery = StandardQueryInfer<typeof querySchema>; // {name: string}
 */
export type StandardQueryInfer<Z extends StandardMiddlewareObject> = Z['query'] extends StandardSchemaQueryType ? StandardOutputInfer<Z['query']> : Query;

/**
 * Validate schema for ExpressJS request
 * @since 0.0.1
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

/**
 * Infer ExpressJS RequestHandler type from StandardMiddlewareObject.
 * @template T - StandardMiddlewareObject
 * @template ResBody - Response body type
 * @template Locals - Locals type
 * @since 0.0.1
 */
export type StandardRequestHandlerInfer<
	T extends StandardMiddlewareObject,
	ResBody = any,
	Locals extends Record<string, any> = Record<string, any>,
> = RequestHandler<StandardParamsInfer<T>, ResBody, StandardBodyInfer<T>, StandardQueryInfer<T>, Locals>;

/**
 * Infer ExpressJS Request type from StandardMiddlewareObject.
 * @template T - StandardMiddlewareObject
 * @template ResBody - Response body type
 * @template Locals - Locals type
 * @since 0.0.1
 */
export type StandardRequestInfer<T extends StandardMiddlewareObject, ResBody = any, Locals extends Record<string, any> = Record<string, any>> = Request<
	StandardParamsInfer<T>,
	ResBody,
	StandardBodyInfer<T>,
	StandardQueryInfer<T>,
	Locals
>;
