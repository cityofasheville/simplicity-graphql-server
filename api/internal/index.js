const itProjectSchema = require('./bpt_project_schema.js');

const schema = [
  itProjectSchema,
  require('./employees/employees_schema'),
];

module.exports = schema;
