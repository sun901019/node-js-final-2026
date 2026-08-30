const { message } = require("statuses");

const appError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};
module.exports = appError;
