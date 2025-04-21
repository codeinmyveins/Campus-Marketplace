const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");

const getColleges = async(req, res) => {
    
    const { page = "1", search, state, district } = req.query;

    const limit = 64;
    const offset = (Number(page) - 1) * limit;

    const params = [
        search || null,
        state || null,
        district || null,
        limit,
        isNaN(offset) ? 0 : offset
    ]

    const { rowCount, rows: colleges } = await pool.query(
        `SELECT
            name,
            state,
            district,
            CASE
                WHEN $1::text IS NOT NULL THEN ts_rank(colleges.document, plainto_tsquery('english', $1))
                ELSE NULL
            END AS rank
        FROM colleges
        WHERE
            ($1::text IS NULL OR colleges.document @@ plainto_tsquery('english', $1))
            AND ($2::text IS NULL OR colleges.state ILIKE $2)
            AND ($3::text IS NULL OR colleges.district ILIKE $3)
        ORDER BY rank
        LIMIT $4
        OFFSET $5`,
        params
    );

    res.status(StatusCodes.OK).json({ nbHits: rowCount, colleges });

}

module.exports = { getColleges };
