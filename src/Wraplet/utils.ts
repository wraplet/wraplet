export const isOverridden = (instance: object, methodName: string): boolean =>
  Object.prototype.hasOwnProperty.call(
    Object.getPrototypeOf(instance),
    methodName,
  );
