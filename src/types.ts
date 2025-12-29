export type MyGenerator = Generator<undefined, void, unknown>;

export type ReturnsGenerator = () => MyGenerator;
