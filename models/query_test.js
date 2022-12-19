const fs = require('fs')
const {pool} = require('../init/db_init')

const tablePrimaryKeyMap = {};//store table vs primary keys
const tableColumnMap = {};
const tableRelations = {};

//-----------------------------
const databaseInfoObject = {
    'show tables':null
};
//----------------------------
let persisted = false;
let done = false;
const queryTest =  () => {
//query 1
pool.query('show tables' ,(error, results, fields) => {
    if(error) {
        throw error;
    }
    else {
        databaseInfoObject['show tables']=results;
        databaseInfoObject["show tables"].forEach(table => {
            let tbName = table["Tables_in_japox"];
            pool.query(`describe ${tbName}` ,(error, results, fields) => {
                if(error) {
                    throw error;
                }
                else {
                    const tableSet = {};
                    databaseInfoObject[tbName] = results;
                    results.forEach(column => {
                        if (column["Key"]==="PRI"){
                            tablePrimaryKeyMap[tbName]=column["Field"];

                            tableSet[`PRI ${column["Field"]}`]="";
                        } else {
                            tableSet[`${column["Field"]}`]="";
                        }       
                    });
                    tableColumnMap[tbName]=tableSet;
                }
            })
        });
    }
    done = true;
})
}

setInterval(()=>{
    if(!persisted){
        persisted=true;
        if(done){
            for (let table in tablePrimaryKeyMap) {
                let relatedTables = [];
                for (let table2 in tableColumnMap) {
                    if(table2 === table)
                    continue;
                    for (let column2 in tableColumnMap[table2]) {
                        let details = column2.split(" ");
                        if (details[0]==="PRI") {
                            continue;
                        }
    
                        if (column2 === tablePrimaryKeyMap[table]) {
                            relatedTables.push(table2);
                        }
                    }
                }
                tableRelations[`${table} ${tablePrimaryKeyMap[table]}`] = relatedTables;
            }
            fs.writeFileSync('data/tableRelation.json',JSON.stringify(tableRelations))
            fs.writeFileSync('data/tablePrimaryKeyMap.json', JSON.stringify(tablePrimaryKeyMap));
            fs.writeFileSync('data/tableColumnMap.json', JSON.stringify(tableColumnMap))
            console.log("done data put")
        }
        
    }
}, 1000)




module.exports = {
    queryTest
}



