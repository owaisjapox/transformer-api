/**
 * TableClass - all DAO objects are instances of this class
 * @tableName -- name of database table 'User'
 * @tableColumnData -- {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    aNumber: {
      type: DataTypes.SMALLINT,
      allowNull: true
    },
    dateAllowNullTrue: {
      type: DataTypes.DATE,
      allowNull: true
    },
    defaultValueBoolean: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    }
  }
 */
class TableClass {
  constructor(tableName, tableColumnData) {
    try {
      if (!TableClass.validateTableName(tableName))
        throw new Error("Invalid Table name");
      if (!TableClass.validateTableColumnData(tableColumnData))
        throw new Error("Invalid schema format");
      this.tableName = tableName;
      this.tableColumnData = tableColumnData;
    } catch (error) {
      console.log(error);
    }
  }

  saveIfNotPresent(rowData) {
    try {
    let sqlQuery = `INSERT INTO ${this.tableName} (`;
    let columnsPresent = [];
    let columnsRequiredButNotPresent = [];
    for (let column in rowData) {
        if (!this.hasColumn(column))
            throw new Error(`Column ${column} Does not Exist for Table ${this.tableName}`);
            columns.push(column);
        }
    for (let keys in this.tableColumnData) {
            if (!this.tableColumnData[keys]["allowNull"] 
            && !Object.keys(rowData).includes(keys)) {
                columnsRequiredButNotPresent.push(keys);
            }
        }
    } catch (error) {
        
    }
    
  }

  save(rowData) {}

  hasColumn(columnName) {
    return (!Object.keys(this.tableColumnData).includes(columnName));
  }

  static validateTableName(tableName) {
    return typeof tableName === "string";
  }
  static validateTableColumnData(tableColumnData) {
    if (typeof tableColumnData !== "object") return false;

    let primaryKeyExists = false;
    let parameters = ["type", "allowNull", "primaryKey", "referenceIn"];
    for (let keys in tableColumnData) {
      if (typeof tableColumnData[keys] !== "object") return false;
      if (
        tableColumnData[keys]["primaryKey"] !== null &&
        tableColumnData[keys]["primaryKey"] !== undefined
      ) {
        if (!primaryKeyExists) primaryKeyExists = true;
        else return false;
        if (typeof tableColumnData[keys]["primaryKey"] !== "boolean")
          return false;
      }
      if (
        tableColumnData[keys]["allowNull"] === null ||
        tableColumnData[keys]["allowNull"] === undefined
      )
        return false;
      if (typeof tableColumnData[keys]["allowNull"] !== "boolean") return false;
      if (
        tableColumnData[keys]["referenceIn"] !== null &&
        tableColumnData[keys]["referenceIn"] !== undefined
      ) {
        if (typeof tableColumnData[keys]["referenceIn"] !== "string")
          return false;
        if (typeof tableColumnData[keys]["referenceIn"].split(".").length !== 2)
          return false;
      }
    }
    return true;
  }
}

module.exports = {
  TableClass,
};
