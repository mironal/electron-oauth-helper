/**
 *
 * @param {object} obj
 * @param {string|[string]} props
 */
const omit = (obj, props) => {

  obj = obj || {}
  props = props || []

  if (typeof props === "string") {
    props = [props]
  }

  return Object.keys(obj).reduce((prev, key) => {
    if (!props.includes(key)) {
      // eslint-disable-next-line
      prev[key] = obj[key]
    }
    return prev
  }, {})
}

/**
 *
 * @param {object} obj
 * @param {string|[string]} props
 */
const pick = (obj, props) => {

  obj = obj || {}
  props = props || []

  if (typeof props === "string") {
    props = [props]
  }

  return Object.keys(obj).reduce((prev, key) => {
    if (props.includes(key)) {
      // eslint-disable-next-line
      prev[key] = obj[key]
    }
    return prev
  }, {})
}

module.exports = {
  omit,
  pick,
}
