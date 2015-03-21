module.exports = {
  getProperty: function(obj, propName, defaultVal) {
      if (obj[propName] !== undefined)
        return obj[propName];
      else
        return defaultVal;
  }
};