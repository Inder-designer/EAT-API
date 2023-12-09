
const handlebars = require('handlebars');
const fs = require('fs').promises;

const compileTemplate = async (templatePath, data) => {
    try {
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      console.error('Error compiling template:', error);
      throw error;
    }
  };
  
module.exports = compileTemplate