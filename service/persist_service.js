const { pool } = require("../init/db_init");
const { getTransactionList } = require("../utils/output_config_reader");

const persist_service = (req, res, next) => {
    const queryList = getTransactionList(req.body);
    //console.log(queryList)
    let transactionSuccess = true; 
    pool.getConnection(function(err, connection) {
        connection.beginTransaction(function(err) {
            if (err) {
                console.log(err);                 //Transaction Error (Rollback and release connection)
                connection.rollback(function() {
                    connection.release();
                    transactionSuccess = false;
                    //Failure
                });
            } else {
                queryList.forEach(query => {
                    connection.query(query, function(err, results) {
                        if (err) {   
                            console.log(err)       //Query Error (Rollback and release connection)
                            connection.rollback(function() {
                                connection.release();
                                transactionSuccess = false;
                                //Failure
                            });
                        } else {
                            connection.commit(function(err) {
                                if (err) {
                                    console.log(err)
                                    connection.rollback(function() {
                                        connection.release();
                                        transactionSuccess = false;
                                        //Failure
                                    });
                                } else {
                                    connection.release();
                                    //Success
                                }
                            });
                        }
                    });
                })
            }    
        });
    });

    
    if (transactionSuccess) {
        res.status(200).send("Success")
    } else {
        res.status(500).send("Failure")
    }
};

module.exports = {
    persist_service
}
