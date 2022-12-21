const bodyParser = require('body-parser');
const express = require('express');
const {pool} = require('./init/db_init');
const mainRouter = require('./routes/router')

//--------------------server initialzation---------------
const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())


//--------------------constants--------------------------
const PORT = process.env.PORT || 5000

//--------------------routes------------------------
app.use('/api/v1', mainRouter);

app.listen(PORT,()=>{
    console.log('server up and running on port', PORT)
});

