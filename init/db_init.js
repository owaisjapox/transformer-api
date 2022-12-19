const mysql = require('mysql')
const dotenv = require('dotenv').config()
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: process.env.DB_CONLIMIT
});

pool.getConnection(function(err, connection) {
    if (err) {
        // not connected!
        console.log("Could not connect to db",err);
    }
    else {
        console.log("connected to db")
    }
});



module.exports = {
    pool
}


