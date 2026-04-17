
/**
 * Utility function for creating a DEEP copy of an object
 *   NOTE: will probably not work with functions or unserializable data types
 * @param obj The thing to copy
 * @param without [optional] root level keys to leave out of the return
 * @returns Copied object
 */
export function deepCopy<T, K extends keyof T>(obj: T, ...without: K[]): Omit<T, K> {
    const copy = structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
    for (const key of without) {
        delete (copy as any)[key];
    }
    return copy;
}