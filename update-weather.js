var url = process.argv[2];
var request = require("request");

function httpRequest(url, callback) {
  request({
    url: url,
    body: "",
    method: "GET",
    rejectUnauthorized: false
  },
  function (error, response, body) {
    callback(error, response, body);
  });
}

function execRequest() {
  httpRequest(url, function (error, response, responseBody) {
    if (error) {
      throw new Error('HTTP get weather function failed: %s', error.message);
    } else {
      console.log(responseBody);
    }
  });
}

if (process.argv[3]!==null) {
  setTimeout(execRequest, process.argv[3]);
} else {
  execRequest();
}
