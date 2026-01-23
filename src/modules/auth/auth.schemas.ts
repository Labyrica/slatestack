import { Type, Static } from "@sinclair/typebox";

export const LoginSchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 8 }),
  rememberMe: Type.Optional(Type.Boolean()),
});

export type LoginInput = Static<typeof LoginSchema>;
