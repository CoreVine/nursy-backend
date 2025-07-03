import handlebars from "handlebars"
import moment from "moment"

handlebars.registerHelper("formatDate", function (date, format) {
  return moment(date).format(format || "MMMM Do, YYYY")
})

handlebars.registerHelper("currentYear", function () {
  return new Date().getFullYear()
})

handlebars.registerHelper("eq", function (a, b) {
  return a === b
})

handlebars.registerHelper("ne", function (a, b) {
  return a !== b
})

handlebars.registerHelper("gt", function (a, b) {
  return a > b
})

handlebars.registerHelper("lt", function (a, b) {
  return a < b
})

handlebars.registerHelper("gte", function (a, b) {
  return a >= b
})

handlebars.registerHelper("lte", function (a, b) {
  return a <= b
})

handlebars.registerHelper("and", function () {
  return Array.prototype.every.call(arguments, Boolean)
})

handlebars.registerHelper("or", function () {
  return Array.prototype.slice.call(arguments, 0, -1).some(Boolean)
})

export default handlebars
