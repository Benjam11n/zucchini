type JsonPrimitive = boolean | null | number | string;

export interface JsonObject {
  [key: string]: JsonValue;
}

type JsonArray = JsonValue[];

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;
