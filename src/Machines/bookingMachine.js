import { assign, createMachine, fromPromise } from "xstate";
import { fetchCountries } from "../utils/api";

const fillCountries = {
	initial: "loading",
	states: {
		loading: {
			invoke: {
				id: "getCountries",
				src: fromPromise(() => fetchCountries()),
				onDone: {
					target: "success",
					actions: assign({ countries: ({ event }) => event.output }),
				},
				onError: {
					target: "failure",
					actions: assign({ error: "fallo el request" }),
				},
			},
		},
		success: {},
		failure: {
			on: {
				RETRY: { target: "loading" },
			},
		},
	},
};

const bookingMachine = createMachine(
	{
		id: "buy plane tickets",
		initial: "initial",
		context: {
			passengers: [],
			selectedCountry: "",
			countries: [],
			error: "",
		},
		states: {
			initial: {
				on: {
					START: {
						target: "search",
						actions: "imprimirInicio",
					},
				},
			},
			search: {
				on: {
					CONTINUE: {
						target: "passengers",
						actions: assign({
							selectedCountry: ({ event }) => event.selectedCountry,
						}),
					},
					CANCEL: "initial",
				},
				...fillCountries,
			},
			tickets: {
				after: {
					5000: {
						target: "initial",
						actions: "cleanContext",
					},
				},
				on: {
					FINISH: "initial",
				},
			},
			passengers: {
				on: {
					DONE: {
						target: "tickets",
						guard: "moreThanOnePassenger",
					},
					CANCEL: {
						target: "initial",
						actions: "cleanContext",
					},
					ADD: {
						target: "passengers",
						actions: assign({
							newPassenger: ({ context, event }) =>
								context.passengers.push(event.newPassenger),
						}),
					},
				},
			},
		},
	},
	{
		actions: {
			cleanContext: assign({
				passengers: [],
				selectedCountry: "",
			}),
		},
		guards: {
			moreThanOnePassenger: ({ context }) => context.passengers.length > 0,
		},
	}
);

export default bookingMachine;
