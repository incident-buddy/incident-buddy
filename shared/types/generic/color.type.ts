export type User = {
	id: string;
	familyName: string;
	givenName: string;
	email: string | null;
};

const color = [
	"red",
	"orange",
	"yellow",
	"lime",
	"green",
	"blue",
	"purple",
	"gray",
];
export type Color = (typeof color)[number];
