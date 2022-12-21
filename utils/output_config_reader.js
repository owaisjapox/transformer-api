const mysql = require('mysql')
const fs = require('fs');
const { pool } = require('../init/db_init');

const output_config_object = JSON.parse(fs.readFileSync('../output_config.json'));

const dataTransformer = (postObject) => {
    output_config_object["configuration"].sort((a, b) => {
        return (a["PRIORITY"] - b["PRIORITY"]);
    });

    output_config_object["configuration"].forEach(tableConfig => {

        let sqlQuery = `INSERT INTO ${tableConfig["TARGET_TABLE"]}(`;
        output_config_object["COLUMNS_DATA"].forEach((column_element) => {

        });
        let columnList = [];
        let valueList = [];
        
        
    });
}

const dataFieldIsPresentInPostObject = (field) => {

}

const getSource = (source) => {

}