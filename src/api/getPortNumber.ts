const getPortNumber = (port?: number | string) => {
  if (typeof port === 'number') {
    return port;
  }

  if (port) {
    return parseInt(port, 10);
  }

  return 0;
};

export default getPortNumber;
