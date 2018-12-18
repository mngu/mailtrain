'use strict';

let db = require('../db');

module.exports.get = (start, limit, search, callback) => {
    db.getConnection((err, connection) => {
        if (err) {
            return callback(err);
        }
        search = '%' + search + '%';
        connection.query('SELECT SQL_CALC_FOUND_ROWS `email` FROM blacklist WHERE `email` LIKE ? ORDER BY `email` LIMIT ? OFFSET ?', [search, limit, start], (err, rows) => {
            if (err) {
                return callback(err);
            }
            
            connection.query('SELECT FOUND_ROWS() AS total', (err, total) => {
                connection.release();
                if (err) {
                    return callback(err);
                }
                let emails = [];
                rows.forEach(email => {
                    emails.push(email.email);
                });
                return callback(null, emails, total && total[0] && total[0].total);
            });
        });
    });
};

module.exports.add = (emails, callback) => {
    db.getConnection((err, connection) => {
        if (err) {
            return callback(err);
        }

        const listEmails = emails.map(email => `('${email}')`);

        connection.query(`INSERT IGNORE INTO blacklist (email) VALUES${listEmails.join(', ')}`, err => {
            if (err) {
                console.log('err', err.sql);
                return callback(err);
            }
            
            connection.release();
            return callback(null, null);
          
        });
    });
};

module.exports.delete = (email, callback) => {
    db.getConnection((err, connection) => {
        if (err) {
            return callback(err);
        }

        connection.query('DELETE FROM `blacklist` WHERE `email`=?', email, err => {
            if (err) {
                return callback(err);
            }
            
            connection.release();
            return callback(null, null);
          
        });
    });
};

module.exports.massDelete = (emails, callback) => {
    db.getConnection((err, connection) => {
        if (err) {
            return callback(err);
        }

        const listEmails = emails.map(email => `'${email}'`);
        connection.query(`DELETE FROM blacklist WHERE email IN (${listEmails.join(', ')})`, err => {
            if (err) {
                return callback(err);
            }

            connection.release();
            return callback(null, null);

        });
    });
};

module.exports.isblacklisted = (email, callback) => {
    db.getConnection((err, connection) => {
        if (err) {
            return callback(err);
        }

        connection.query('SELECT `email` FROM blacklist WHERE `email`=?', email, (err, rows) => {
            if (err) {
                return callback(err);
            }
            
            connection.release();
            if (rows.length > 0) {
                return callback(null, true);
            } else {
                return callback(null, false);
            }          
        });
    });
};
