type JsonPrimitive = boolean | null | number | string;

interface JsonObject {
  [key: string]: JsonValue;
}

type JsonArray = JsonValue[];

export type JsonValue = JsonArray | JsonObject | JsonPrimitive;
