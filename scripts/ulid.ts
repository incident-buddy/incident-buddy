import { ulid } from "jsr:@std/ulid@1";

[...Array(100)].forEach(() => console.log(ulid()));