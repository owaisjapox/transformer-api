const { pool } = require("../init/db_init");
const { getTransactionList } = require("../utils/output_config_reader");

const persist_service = (req, res, next) => {
    getTransactionList(req.body, (queryList) => {
        console.log("QUERY LIST--->", queryList);
    let transactionSuccess = true; 
    pool.getConnection(function(err, connection) {
        connection.beginTransaction(function(err) {
            if (err) {
                //Transaction Error (Rollback and release connection)
                connection.rollback(function() {
                    connection.release();
                    transactionSuccess = false;
                    //Failure
                });
                res.status(500).send(err)
            } else {
                if (queryList === null || queryList === undefined)
                    res.status(500).json({
                        "message":"something went wrong"
                    })
                if (queryList.length === 0) {
                    res.status(200).json({
                        "message":"no modification done",
                        queryList
                    })
                } 
                queryList.forEach(query => {
                    connection.query(query, function(err, results) {
                        if (err) {   
                            //Query Error (Rollback and release connection)
                            connection.rollback(function() {
                                connection.release();
                                transactionSuccess = false;
                                //Failure
                                res.status(500).send(err)
                            });
                        } else {
                            connection.commit(function(err) {
                                if (err) {
                                    console.log(err)
                                    connection.rollback(function() {
                                        connection.release();
                                        transactionSuccess = false;
                                        //Failure
                                        res.status(500).send(err)
                                    });
                                } else {
                                    connection.release();
                                    res.status(200).json({
                                        "message":"tables modified",
                                        queryList
                                    })
                                }
                            });
                        }
                    });
                })
            }    
        });
    });
    });
};

module.exports = {
    persist_service
}
