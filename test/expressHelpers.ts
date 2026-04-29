import Express, {type Application, type ErrorRequestHandler, type RequestHandler} from 'express';
import type {Server} from 'http';
import {ValidateRequestError} from '../src/ValidateRequestError';

const app = Express();

let server: undefined | Server;
export function startExpress(port: string | number): Promise<Application> {
	return new Promise((resolve) => {
		server = app.listen(port, () => {
			app.use(Express.json());
			resolve(app);
		});
	});
}

export function stopExpress(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (!server) {
			reject(new Error('no express instance found'));
		} else {
			server.close(() => {
				resolve();
			});
		}
	});
}

export const errorMiddleWare: ErrorRequestHandler = (err, _req, res, next) => {
	if (err instanceof ValidateRequestError) {
		return res.status(400).send(`ValidateRequestError:${err.message}`);
	}
	if (err instanceof Error) {
		return res.status(500).send(`${err.name}:${err.message}`);
	}
	return next();
};

export const okResponseHandler: RequestHandler = (_req, res) => {
	res.status(200).send('OK');
};
