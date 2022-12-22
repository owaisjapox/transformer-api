const mysql = require("mysql");
const fs = require("fs");
const { pool } = require("../init/db_init");
const { CustomFunctions } = require("../customFunctions");

const output_config_object = JSON.parse(
  fs.readFileSync("output_config.json")
);


const getTransactionList = (postRequestObject) => {
  output_config_object["configuration"].sort((a, b) => {
    return a["PRIORITY"] - b["PRIORITY"];
  });


//---------------REMOVE BELOW LINE --ITS ONLY FOR TESTING 
output_config_object["configuration"] =  output_config_object["configuration"].slice(0, 1);

  let queryTransactionList = [];

  output_config_object["configuration"].forEach((tableConfig) => {
   
    // ----- columns to be inserted
    let columnList = [];
    // ----- values for those columns
    let valueList = [];
    /* above two can be configured to be single object instead of two arrays / 
       will see later which is more favorable
    */

    tableConfig["COLUMNS_DATA"].forEach((column_element) => {
      if (column_element["PK"]) {
        // ignore nothing to do , PK will be auto generated ** still configuration possible
      } else if (
        column_element["SOURCE"] &&
        dataFieldIsPresentInPostObject(postRequestObject, column_element)
      ) {
        handleDataFieldPresent(postRequestObject, column_element, columnList, valueList);
      } else if (
        column_element["SOURCE"] && 
        dataFieldPresentInECDB(column_element, postRequestObject)
      ) {
        handleDataFieldPresentInECDB(column_element, columnList, valueList);
      } else if (column_element["SOURCE"] && generatorFunctionPresent(column_element)) {
        handleGeneratorFunctionPresent(column_element, postRequestObject, columnList, valueList);
      } else if (column_element["DEFAULT"]!==undefined && 
      column_element["DEFAULT"]!==null && 
      column_element["REQUIRED"]) {
        handleDefaultPresent(column_element, columnList, valueList);
      }
    });




    valueList = valueList.map(value => {
        if(typeof value === "string"){
            return `'${value}'`;
        } else {
            return value;
        }
    })

    let sqlQuery = `INSERT INTO ${tableConfig["TARGET_TABLE"]}(${columnList.join()}) VALUES(${valueList.join()})`;

    queryTransactionList.push(sqlQuery);
  });

  return queryTransactionList;
};

const handleDataFieldPresent = (postRequestObject, column_element, columnList, valueList) => {
    const source = column_element["SOURCE"]
    const sourceColumnName = source.split(".")[1];
    columnList.push(column_element["NAME"]);//name of target column
    valueList.push(postRequestObject["DATA"][sourceColumnName]);// value of target column
}

const handleDefaultPresent = (column_element, columnList, valueList) => {
    const columnName = column_element["SOURCE"].split(".")[1];

    defaultValue = column_element["DEFAULT"];
    if (defaultValue === null)
    defaultValue = 'NULL';
    columnList.push(column_element["NAME"]);
    valueList.push(defaultValue);
}

const handleDataFieldPresentInECDB = (column_element, postRequestObject, columnList, valueList) => {
    const source = column_element["SOURCE"].split(".");
    const conditions = column_element["CONDITION"];
    let counter = 0;
    while (conditions.includes("?")) {
        let value = getValueFromPostRequest(column_element["CONDITION_VALUES"], counter, postRequestObject);
        if (value === null) 
            value='NULL'
        conditions = conditions.replace("?", value);
        counter++;
    }
    const source_table = source[0];
    const source_column = source[1];
    let query = `SELECT ${source_column} FROM ${source_table} WHERE ${conditions}`;
    console.log(query);
    pool.query(query, (error, result, fields) => {
        if (error)
            throw error;
        else {

            columnList.push(column_element["NAME"]);
            if ( result[0][source_column] === null )
                result[0][source_column]='NULL';
            valueList.push(result[0][source_column]);
        }
    });
}

const handleGeneratorFunctionPresent = (column_element, postRequestObject, columnList, valueList) => {
    let source = column_element["SOURCE"];
    if (source.length <= 2)
        return false;
    let functionName = source.substring(0,source.length - 2);
    const value = CustomFunctions.CustomMethods[functionName](postRequestObject);
    if (value === null) {
        value = 'NULL';
    }
    columnList.push(column_element["NAME"]);
    valueList.push(value);
}


const dataFieldPresentInECDB = (column_element, postRequestObject) => {
    const source = column_element["SOURCE"].split(".");
    let conditions = column_element["CONDITION"];
    let counter = 0;
    while (conditions.includes("?")) {
        let value = getValueFromPostRequest(column_element["CONDITION_VALUES"], counter, postRequestObject);
        if (value === null) 
            value='NULL';
        if (typeof value === "string" && value!== 'NULL'){
            value=`'${value}'`;
        }
        conditions = conditions.replace("?", value);
        counter++;
    }
    const source_table = source[0];
    const source_column = source[1];
    let query = `SELECT ${source_column} FROM ${source_table} WHERE ${conditions}`;
    let returnResult = false;
    pool.query(query, (error, result, fields) => {
        if (error)
            returnResult = false;
        else if (result.length === 0)
            returnResult = false;
        else
            returnResult = true;
    });

    return returnResult;
}

const generatorFunctionPresent = (column_element) => {
    let source = column_element["SOURCE"];
    if (source.length <= 2)
        return false;
    let functionName = source.substring(0,source.length - 2);
    return (Object.keys(CustomFunctions.CustomMethods).includes(functionName));
}

const getValueFromPostRequest = (condition_values, index, postRequestObject) => {
    let source = condition_values[index];
    
    source = source.split(".");
    if (postRequestObject["TABLE"] !== source[0])
        return null;
    if (!Object.keys(postRequestObject["DATA"]).includes(source[1]))
        return null;
    return postRequestObject["DATA"][source[1]];
}

/**
 * Checks if the source datafield is present in the post request
 * @param {*} postRequestObject -- the post request object as received from API call
 * @param {*} field -- can be either of three formats
 * 1)"DJANGODB.COLUMN"
 * 2)"ECDB.COLUMN"
 * 3)"customFunction()"
 * This shall be present in the output_config.json as
 * ["configuration"]["index of a EC table"]["COLUMNS_DATA"]["SOURCE"] file
 * @returns
 */
const dataFieldIsPresentInPostObject = (postRequestObject, column_element) => {
  let field = column_element["SOURCE"];
  const sourceData = field.split("."); //"DEALER.COL" --> ["DEALER","COL"]
  if (sourceData.length !== 2) return false;
  const sourceField = sourceData[1]; //"COL"

  /* check if the post request source table is the right one for the EC database col
   */
  if (!(postRequestObject["TABLE"] && postRequestObject["TABLE"] === sourceData[0]))
    return false;
  // check if the post request source column is the right one for the EC database col
  return (
    Object.keys(postRequestObject["DATA"]).includes(sourceField) &&
    postRequestObject[sourceField] !== null
  );
};

const getSource = (source) => {};

module.exports = {
  output_config_object,
  getTransactionList
};
