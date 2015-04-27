module.exports = {
  getProperty: function(obj, propName, defaultVal, nullVal) {
      if (!obj.hasOwnProperty(propName))
        return defaultVal;
      if (obj[propName] !== undefined) {
        if (obj[propName] == null)
            return nullVal;
        else
            return obj[propName];
      }
      else
        return defaultVal;
  },
  binSearchArray: function(elem, arr) {
      var start = 0;
      var end = arr.length - 1;
      var location;
      while (start <= end) {
          var index = Math.floor((start + end) / 2);
          if (arr[index] == elem)
              return index;
          else if (arr[index] < elem) {
              start = index + 1;
              location = start;
          }
          else {
              end = index - 1;
              location = index;
          }
      }
      return -location - 1;
  }
};