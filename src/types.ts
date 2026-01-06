export type MyGenerator = Generator<unknown, void, unknown>;

export type ReturnsGenerator = () => MyGenerator;
