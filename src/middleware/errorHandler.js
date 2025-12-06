const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ 
            error: 'Duplicate entry' 
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(404).json({ 
            error: 'Referenced record not found' 
        });
    }

    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = errorHandler;