const fs = require('fs');

/**
 * 
 */
const configurationIsValid = () => {
    const configObject = JSON.parse(fs.readFileSync('../output_config.json'))
    if (!Object.entries(configObject).includes('configuration'))
        throw new Error('configuration tag not present');
    if (!Array.isArray(configObject['configuration']))
        throw new Error('configuration tag is not array');
    configObject['configuration'].forEach(element => {
        if (typeof element === "object"){
            
        } else {
            throw new Error('configuration array element must be an object')
        }
    });
}


module.exports = {
    configurationIsValid
};