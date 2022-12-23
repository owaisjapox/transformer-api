const mysql = require("mysql");
const fs = require("fs");
const { pool } = require("../init/db_init");
const { CustomFunctions } = require("../customFunctions");

const output_config_object = JSON.parse(
  fs.readFileSync("output_config.json")
);

output_config_object["configuration"].sort((a, b) => {
  return a["PRIORITY"] - b["PRIORITY"];
});

//---------------REMOVE BELOW LINE --ITS ONLY FOR TESTING 
output_config_object["configuration"] =  output_config_object["configuration"].slice(0, 2);

const getTransactionList = (postRequestObject ,callback) => {

  let queryTransactionList = [];

  for (let table_index = 0; 
      table_index < output_config_object["configuration"].length;
      table_index++) {
    let tableConfig = output_config_object["configuration"][table_index];
    // ----- columns to be inserted
    let columnList = [];
    // ----- values for those columns
    let valueList = [];
    // ----- unique column list / dont insert data in table if value for unique col present already present
    let uniqueColumnList = [];
    /* above two can be configured to be single object instead of two arrays / 
       will see later which is more favorable
    */
    console.log(getTransactionList.name+":"+"for "+tableConfig["TARGET_TABLE"]);
    for (let column_element_index=0;
       column_element_index<tableConfig["COLUMNS_DATA"].length;
       column_element_index++) {

      const column_element = tableConfig["COLUMNS_DATA"][column_element_index];
      if (column_element["PK"]) {
        // ignore nothing to do , PK will be auto generated ** still configuration possible
      } else if (
        column_element["SOURCE"]
      ) {
        let IfValid = dataFieldIsPresentInPostObject(
          column_element,
          postRequestObject,
          columnList, 
          valueList
          );
        if (!IfValid)
          IfValid = dataFieldPresentInECDB(
            column_element, 
            postRequestObject, 
            columnList, 
            valueList
            );
        if (!IfValid)
          IfValid = generatorFunctionPresent(
            column_element, 
            postRequestObject, 
            columnList, 
            valueList
            );
      } else if (
      column_element["DEFAULT"]!==undefined && 
      column_element["DEFAULT"]!==null && 
      column_element["REQUIRED"]
      ) {
      handleDefaultPresent(column_element, columnList, valueList);
      }
      if (column_element["UNIQUE"]) {
        uniqueColumnList.push(column_element["NAME"])
      }

    }

    valueList = valueList.map(value => {
        if(typeof value === "string"){
            return `'${value}'`;
        } else {
            return value;
        }
    })

    const checkUniqueColumns = [];
    const checkUniqueValues = [];
    
    columnList.forEach((column, index) => {
      if (uniqueColumnList.includes(column)) {
        checkUniqueColumns.push(column);
        checkUniqueValues.push(valueList[index]);
      }
    });

    let insertQueryCanBeExecuted = true;
    
    
    for (let index = 0; index < checkUniqueColumns.length; index++) {
      const column = checkUniqueColumns[index];
      const value = checkUniqueValues[index];
      const checkUniqueValueAlreadyExistsQuery 
      = `SELECT COUNT(*) FROM ${tableConfig["TARGET_TABLE"]} WHERE ${column}=${value}`;
      pool.query(checkUniqueValueAlreadyExistsQuery, (err, result, fields) => {
        if (err)
          throw err;
          
        if (result[0]["COUNT(*)"]!==0) {
          console.log(result);
          insertQueryCanBeExecuted = false;
        }

        if(insertQueryCanBeExecuted && index === checkUniqueColumns.length - 1) {
          const sqlQuery = `INSERT INTO ${tableConfig["TARGET_TABLE"]}(${columnList.join()}) VALUES(${valueList.join()})`;
          queryTransactionList.push(sqlQuery);
        }
        if (table_index === output_config_object["configuration"].length - 1)
        callback(queryTransactionList);
      })
    };
  };
};

const handleDataFieldPresent = (column_element, postRequestObject,  columnList, valueList) => {
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
    console.log("IN handleDataFieldPresentInECDB")
    const source = column_element["SOURCE"].split(".");
    let conditions = column_element["CONDITION"];
    let counter = 0;
    while (conditions.includes("?")) {
        let value = getValueFromPostRequest(column_element["CONDITION_VALUES"], counter, postRequestObject);
        if (value === null) 
            value='NULL'
        if (typeof value === "string")
            value = `'${value}'`
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
            console.log("")
            columnList.push(column_element["NAME"]);
            if ( result[0][source_column] === null )
                result[0][source_column]='NULL';
            valueList.push(result[0][source_column]);
        }
    });

    console.log("OUT handleDataFieldPresentInECDB");
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


const dataFieldPresentInECDB = (            
  column_element, 
  postRequestObject, 
  columnList, 
  valueList
  ) => {
    console.log("In dataFieldPresentInECDB")
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
    console.log("IS DATA PRESENT IN EC DB QUERY ->",query)
    let returnResult = false;
    pool.query(query, (error, result, fields) => {
        if (error)
            return false;
        else if (result.length === 0)
            return false;
        else
           {
            handleDataFieldPresentInECDB(
              column_element,
              postRequestObject,
              columnList,
              valueList
              ); return true;
            }
    });
}

const generatorFunctionPresent = (column_element, postRequestObject, columnList, valueList) => {
    let source = column_element["SOURCE"];
    if (source.length <= 2)
        return false;
    let functionName = source.substring(0,source.length - 2);
    let isValid = (Object.keys(CustomFunctions.CustomMethods).includes(functionName));
    if (isValid)
      handleGeneratorFunctionPresent(column_element, postRequestObject, columnList, valueList);
    return isValid;
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
const dataFieldIsPresentInPostObject = (
  column_element,
  postRequestObject,
  columnList, 
  valueList
  ) => {
  let field = column_element["SOURCE"];
  const sourceData = field.split("."); //"DEALER.COL" --> ["DEALER","COL"]
  if (sourceData.length !== 2) return false;
  const sourceField = sourceData[1]; //"COL"

  /* check if the post request source table is the right one for the EC database col
   */
  if (!(postRequestObject["TABLE"] && postRequestObject["TABLE"] === sourceData[0]))
    return false;
  // check if the post request source column is the right one for the EC database col
  let isValid = (
    Object.keys(postRequestObject["DATA"]).includes(sourceField) &&
    postRequestObject[sourceField] !== null
  );
  if(isValid)
    handleDataFieldPresent(column_element, postRequestObject, columnList, valueList);
  return isValid;
};

const getSource = (source) => {};

module.exports = {
  output_config_object,
  getTransactionList
};
