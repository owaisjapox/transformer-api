const persist_service = (req, res, next) => {
    //console.log(req.body)
    res.status(200).send('working')
};

module.exports = {
    persist_service
}
