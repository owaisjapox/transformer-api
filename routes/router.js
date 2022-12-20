const express = require('express');
const { persist_service } = require('../service/persist_service');

const router = express.Router();

router.post("/persist",validator,persist_service)

const validator = () => {
    next();
}


module.exports = router;