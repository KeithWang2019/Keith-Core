let AppProxyHandler = {
  get(target, property, receiver) {
    if (property.startsWith("$")) {
      return target.__plugins[property.substring(1)];
    } else {
      return Reflect.get(target, property, receiver);
    }
  },
};

export default AppProxyHandler;
