class Logger {
  constructor(name) {
    this.name = name
  }

  error(message, details = {}, tag = null) {
    let msg = message
    if (Object.keys(details).length > 0) {
      msg = { message, details };
      console.log(msg);
    }

  }

  info(message, details = {}, tag = null) {
    let msg = message
    if (Object.keys(details).length > 0) {
      msg = { message, details };
      console.log(msg);
    }

  }

  warn(message, details = {}, tag = null) {
    let msg = message
    if (Object.keys(details).length > 0) {
      msg = { message, details };
      console.log(msg);
    }

  }
}

export default Logger
