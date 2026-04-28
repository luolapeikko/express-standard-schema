import type {StandardSchemaV1} from '@standard-schema/spec';
import type {Request, RequestHandler} from 'express';
import type {ParamsDictionary, Query} from 'express-serve-static-core';

/** Base type for Standard Schema Body */
type StandardSchemaBodyType<T = unknown> = StandardSchemaV1<unknown, T>;

/** Base type for Standard Schema Params */
type StandardSchemaParamsType<T = unknown> = StandardSchemaV1<ParamsDictionary, T>;

/** Base type for Standard Schema Query params */
type StandardSchemaQueryType<T = unknown> = StandardSchemaV1<Query, T>;

/** Infer output type from StandardSchemaV1 */
type StandardInputInfer<T> = T extends StandardSchemaV1<infer U, infer _> ? U : never;

type StandardOutputInfer<T> = T extends StandardSchemaV1<infer _, infer V> ? V : never;

/**
 * Infer ExpressJS Output Params type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.10
 */
export type StandardParamsOutInfer<Z extends StandardMiddlewareObject> = Z['params'] extends StandardSchemaV1 ? StandardOutputInfer<Z['params']> : ParamsDictionary;

/**
 * Infer ExpressJS Output Body type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.10
 */
export type StandardBodyOutInfer<Z extends StandardMiddlewareObject> = Z['body'] extends StandardSchemaV1 ? StandardOutputInfer<Z['body']> : unknown;

/**
 * Infer ExpressJS Output Query type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.10
 */
export type StandardQueryOutInfer<Z extends StandardMiddlewareObject> = Z['query'] extends StandardSchemaV1 ? StandardOutputInfer<Z['query']> : Query;

/**
 * Infer ExpressJS RequestHandler type with validated output type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @template ResBody - Response body type
 * @template Locals - Locals type
 * @since 0.0.10
 */
export type ValidatedOutputRequestHandler<
	ResBody = any,
	Locals extends Record<string, any> = Record<string, any>,
	Z extends StandardMiddlewareObject = StandardMiddlewareObject,
> = RequestHandler<StandardParamsOutInfer<Z>, ResBody, StandardBodyOutInfer<Z>, StandardQueryOutInfer<Z>, Locals>;

/**
 * Infer ExpressJS Params type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.1
 * @example
 * const paramsSchema = {params: z.object({id: z.string()})} satisfies StandardMiddlewareObject;
 * type DemoParams = StandardParamsInfer<typeof paramsSchema>; // {id: string}
 */
export type StandardParamsInfer<Z extends StandardMiddlewareObject> = Z['params'] extends StandardSchemaParamsType
	? StandardInputInfer<Z['params']>
	: ParamsDictionary;

/**
 * Infer ExpressJS Body type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.1
 * @example
 * const bodySchema = {body: z.object({name: z.string()})} satisfies StandardMiddlewareObject;
 * type DemoBody = StandardBodyInfer<typeof bodySchema>; // {name: string}
 */
export type StandardBodyInfer<Z extends StandardMiddlewareObject> = Z['body'] extends StandardSchemaBodyType ? StandardInputInfer<Z['body']> : unknown;

/**
 * Infer ExpressJS Query type from StandardMiddlewareObject.
 * @template Z - StandardMiddlewareObject
 * @since 0.0.1
 * @example
 * const querySchema = {query: z.object({name: z.string()})} satisfies StandardMiddlewareObject;
 * type DemoQuery = StandardQueryInfer<typeof querySchema>; // {name: string}
 */
export type StandardQueryInfer<Z extends StandardMiddlewareObject> = Z['query'] extends StandardSchemaQueryType ? StandardInputInfer<Z['query']> : Query;

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
export type StandardMiddlewareObject = Readonly<{
	body?: StandardSchemaBodyType;
	params?: StandardSchemaParamsType;
	query?: StandardSchemaQueryType;
}>;

/**
 * Infer ExpressJS RequestHandler type from StandardMiddlewareObject.
 * @template T - StandardMiddlewareObject
 * @template ResBody - Response body type
 * @template Locals - Locals type
 * @since 0.0.1
 * @example
 * export const validateSchema = {
 * 	body: z.object({
 * 		name: z.string().min(1),
 * 	}),
 * } satisfies StandardMiddlewareObject;
 * export type DemoRequestHandler = StandardRequestHandlerInfer<typeof validateSchema>;
 * // DemoRequestHandler is RequestHandler<ParamsDictionary, any, {name: string}, QueryString.ParsedQs, Record<string, any>>
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
 * @example
 * export const validateSchema = {
 * 	body: z.object({
 * 		name: z.string().min(1),
 * 	}),
 * } satisfies StandardMiddlewareObject;
 * export type DemoRequest = StandardRequestInfer<typeof validateSchema>;
 * // DemoRequest is Request<ParamsDictionary, any, {name: string}, QueryString.ParsedQs, Record<string, any>>
 */
export type StandardRequestInfer<T extends StandardMiddlewareObject, ResBody = any, Locals extends Record<string, any> = Record<string, any>> = Request<
	StandardParamsInfer<T>,
	ResBody,
	StandardBodyInfer<T>,
	StandardQueryInfer<T>,
	Locals
>;
