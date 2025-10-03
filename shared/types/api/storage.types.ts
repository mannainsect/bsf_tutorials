export type JsonPrimitive = string | number | boolean | null
export type JsonArray = JsonSerializable[]
export type JsonObject = { [key: string]: JsonSerializable }
export type JsonSerializable = JsonPrimitive | JsonArray | JsonObject