export const isOverridden = (
  instance: object,
  methodName: string,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  stopAt?: Function,
): boolean => {
  let proto = Object.getPrototypeOf(instance);
  const stopProto = stopAt ? stopAt.prototype : Object.getPrototypeOf(proto);
  while (proto && proto !== stopProto) {
    if (Object.prototype.hasOwnProperty.call(proto, methodName)) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return false;
};
