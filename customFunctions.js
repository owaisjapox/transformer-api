const sql = require('mysql');
const { pool } = require('./init/db_init');

class CustomFunctions {

    static CustomMethods = {
        "generateStockNumber": function (postData) {
            let value = "JPX-" + Math.floor(Math.random() * 899999 + 100000);
            let countResults = 1;
            let query = `SELECT COUNT(*) FROM VEHICLE_DETAILS WHERE STOCK_NUMBER='${value}'`;
            pool.query(query ,(error, results, fields) => {
                countResults = results[0]['COUNT(*)'];
            });
            if (countResults === 0)
            return value;
        }
    };

}

module.exports = {
    CustomFunctions
}