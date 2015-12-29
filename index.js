var es = require('event-stream');
var rollsum = require('rollsum');

var split = function () {

  var over = null;
  var rs = rollsum();

  var write = function (data) {

    var self = this;
    var last = 0;

    rs.roll(data).forEach(function (i) {

      if (over !== null) {
        self.emit('data', Buffer.concat([over, data.slice(last, i)]));
        over = null;
      } else if (i !== last) {
        self.emit('data', data.slice(last, i));
      }

      last = i;
    });

    if (over !== null) {
      over = Buffer.concat([over, data.slice(last)]);
    } else {
      over = data.slice(last);
    }
  };

  var end = function () {
    if (over !== null) {
      this.emit('data', over);
    }
    this.emit('end');
  };

  return es.through(write, end);
};

module.exports = split;
