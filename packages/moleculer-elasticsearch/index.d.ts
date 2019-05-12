declare module "moleculer-elasticsearch" {
	import { ServiceSchema } from "moleculer";

	export const actions: {
		bulk: {
			handler: any;
			params: {
				body: {
					type: string;
				};
				index: {
					optional: boolean;
					type: string;
				};
				type: {
					optional: boolean;
					type: string;
				};
			};
		};
		call: {
			handler: any;
			params: {
				api: {
					type: string;
				};
				params: {
					type: string;
				};
			};
		};
		count: {
			handler: any;
			params: {
				body: {
					optional: boolean;
					type: string;
				};
				q: {
					optional: boolean;
					type: string;
				};
			};
		};
		create: {
			handler: any;
			params: {
				body: {
					type: string;
				};
				id: {
					type: string;
				};
				index: {
					type: string;
				};
				type: {
					type: string;
				};
			};
		};
		delete: {
			handler: any;
			params: {
				id: {
					type: string;
				};
				index: {
					type: string;
				};
				type: {
					type: string;
				};
			};
		};
		get: {
			handler: any;
			params: {
				id: {
					type: string;
				};
				index: {
					type: string;
				};
				type: {
					type: string;
				};
			};
		};
		search: {
			handler: any;
			params: {
				body: {
					optional: boolean;
					type: string;
				};
				q: {
					optional: boolean;
					type: string;
				};
			};
		};
		update: {
			handler: any;
			params: {
				body: {
					type: string;
				};
				id: {
					type: string;
				};
				index: {
					type: string;
				};
				type: {
					type: string;
				};
			};
		};
	};

	export const methods: {};

	export const name: string;

	export const settings: {
		elasticsearch: {
			apiVersion: string;
			host: string;
		};
	};
}
