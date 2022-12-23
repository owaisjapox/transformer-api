const express = require('express');
const { persist_service } = require('../service/persist_service');

const router = express.Router();

/**
 * This method is supposed to validate the request format 
 * after checking with input_config.json
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const validator = (req, res, next) => {   
    next();
}

router.post("/persist", validator, persist_service)

module.exports = router;