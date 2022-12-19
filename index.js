const express = require('express');
const {pool} = require('./init/db_init');
const { queryTest } = require('./models/query_test');

//--------------------server initialzation---------------
const app = express();

//--------------constants---------------------
const PORT = process.env.PORT || 5000

//queryTest();

app.listen(PORT,()=>{
    console.log('server up and running on port',PORT)
})