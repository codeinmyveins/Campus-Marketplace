// require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");
const fs = require("fs");
const path = require("path");

const {
    validateItemPostInfoRequired, validateItemPostInfo,
    priceSchema, itemImageReorderSchema
} = require("../validator");

const getItem = async (req, res) => {

    const item_id = req.params.id;

    const { rowCount, rows: items } = await pool.query(`
        SELECT
            i.*,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'name', c.name,
                    'state', c.state,
                    'district', c.district
                )
            )AS college,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', img.id,
                        'name', img.name,
                        'url', img.url
                    )
                    ORDER BY img.order_idx
                ) FILTER (WHERE img.id IS NOT NULL),
                '[]'::json
            ) AS images
        FROM items i
        LEFT JOIN item_images img ON i.id = img.item_id
        LEFT JOIN users u ON u.id = i.user_id
        LEFT JOIN colleges c ON c.id = u.college_id
        WHERE i.id = $1
        GROUP BY i.id`,
        [item_id]
    );
    if (rowCount === 0) {
        throw new CustomAPIError(`No item with id ${item_id} found`, StatusCodes.NOT_FOUND);
    }

    res.status(StatusCodes.OK).json({ item: items[0] });

}

const getItems = async (req, res) => {

    const { page = "1", search, type = "sell", item_category, closed = "false",
        price_min, price_max, user_id, sort,
        created_from, created_to, college_name } = req.query;

    const limit = 20;
    const offset = (Number(page) - 1) * limit;

    const params = [
        type ? type.split(",") : null,
        item_category ? item_category.split(",") : null,
        closed === "all" ? null : (closed === "true" ? "true" : "false"),
        !isNaN(Number(user_id))? Number(user_id) : null,
        created_from || null,
        created_to || null,
        search || null,
        price_min ? parseFloat(price_min) : null,
        price_max ? parseFloat(price_max) : null,
        college_name && !user_id ? college_name.split(",") : null,
        limit,
        isNaN(offset) ? 0 : offset
    ];

    const sortFieldsRaw = sort ? sort.split(",") : [];
    const relevanceSortIndex = sortFieldsRaw.indexOf("relevance");
    const hasRelevanceSort = relevanceSortIndex !== -1;

    if (hasRelevanceSort && search) {
        sortFieldsRaw[relevanceSortIndex] = "-rank";
    } else if (hasRelevanceSort && !search) {
        if (sortFieldsRaw.length === 0)
            sortFieldsRaw[relevanceSortIndex] = "-created_at";
        else
            sortFieldsRaw.splice(relevanceSortIndex, 1);
    } else if (search) {
        if (sortFieldsRaw.length === 0)
            sortFieldsRaw.push("-rank");
        else
            sortFieldsRaw.push("-created_at");
    } else {
        sortFieldsRaw.push("-created_at");
    }

    const orderByClause = sortFieldsRaw.map(field => {
        const dir = field.startsWith("-") ? "DESC" : "ASC";
        const column = field.replace(/^-/, "");
        const allowed = ["item_name", "created_at", "modified_at", "price", "rank"];
        return allowed.includes(column) ? `${column} ${dir}` : null;
    }).filter(Boolean).join(", ");

    const { rowCount, rows: items } = await pool.query(`
        SELECT
            i.id,
            i.item_name,
            i.title,
            i.item_category,
            LEFT(i.description, 64) AS description,
            i.price,
            i.type,
            c.name AS college_name,
            i.closed,
            i.created_at,
            i.modified_at,
            CASE
                WHEN img.id IS NULL THEN NULL
                ELSE JSON_BUILD_OBJECT(
                    'id', img.id,
                    'name', img.name,
                    'url', img.url
                )
            END AS cover_img,
            CASE
                WHEN $7::text IS NOT NULL THEN ts_rank(i.document, plainto_tsquery('english', $7))
                ELSE NULL
            END AS rank
        FROM items i
        LEFT JOIN item_images img ON i.id = img.item_id AND img.order_idx = 0
        LEFT JOIN users u ON u.id = i.user_id
        LEFT JOIN colleges c ON c.id = u.college_id
        WHERE
            ($1::item_type_enum[] IS NULL OR i.type = ANY($1::item_type_enum[]))
            AND ($2::text[] IS NULL OR i.item_category = ANY($2))
            AND ($3::boolean IS NULL OR i.closed = $3)
            AND ($4::int IS NULL OR i.user_id = $4)
            AND ($5::timestamptz IS NULL OR i.created_at >= $5)
            AND ($6::timestamptz IS NULL OR i.created_at <= $6)
            AND ($7::text IS NULL OR i.document @@ plainto_tsquery('english', $7))
            AND ($8::numeric IS NULL OR i.price >= $8)
            AND ($9::numeric IS NULL OR i.price <= $9)
            AND ($10::text[] IS NULL OR c.name = ANY($10))
        ORDER BY ${orderByClause}
        LIMIT $11
        OFFSET $12
        `, params);

    res.status(StatusCodes.OK).json({ itemCount: rowCount, items });

}

const postItem = async (req, res) => {
    
    const { error, value: joiValue } = validateItemPostInfoRequired(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { userId } = req.user;
    const { item_name, item_category, title, description, location, price, type } = joiValue;
    
    const { rows: items } = await pool.query("INSERT INTO items (user_id, item_name, item_category, title, description, location, price, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
        [userId, item_name, item_category, title, description, location, price, type]
    );
    
    // res.status(StatusCodes.CREATED).json({ item: { ...items[0], images: [] } });
    res.status(StatusCodes.CREATED).json({ msg: "Item post created successfully", item: items[0] });
    
}

const deleteItem = async (req, res) => {

    const item_id = req.params.id;

    const { rowCount } = await pool.query("DELETE FROM items WHERE id = $1",
        [item_id]
    );
    if (rowCount === 0) {
        throw new CustomAPIError(`No item post with id: ${item_id} found`, StatusCodes.NOT_FOUND);
    }

    res.status(StatusCodes.OK).json({ msg: "Successfully deleted item post" });

}

const editItem = async (req, res) => {

    const item_id = req.params.id;

    const { error, value: joiValue } = validateItemPostInfo(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { item_name, item_category, title, description, location, price: inputPrice, closed } = joiValue;

    const { rowCount, rows: [ { type } ] } = await pool.query("SELECT type FROM items WHERE id = $1",
        [item_id]
    );
    if (rowCount === 0) {
        throw new CustomAPIError(`No item post with id: ${item_id} found`, StatusCodes.NOT_FOUND);
    }

    const priceSchemaTT = (type === "sell" || type === "lend") ? priceSchema.optional() : priceSchema.forbidden();
    const { error: error2, value: price } = priceSchemaTT.validate(inputPrice);
    if (error2) {
        throw new CustomAPIError("\"price\" is not allowed", StatusCodes.BAD_REQUEST);
    }

    const patched = {};

    if (item_name)
        patched.item_name = item_name;
    if (item_category)
        patched.item_category = item_category;
    if (title)
        patched.title = title;
    if (description)
        patched.description =description;
    if (location)
        patched.location = location;
    if (price)
        patched.price = price;
    if (closed !== undefined && closed !== null)
        patched.closed = closed;

    const inputKeys = Object.keys(patched);
    if (inputKeys.length === 0) {
        throw new CustomAPIError("Please provide the fields", StatusCodes.BAD_REQUEST);
    }

    const columnName = inputKeys.map((key, index) => `${key} = $${index+1}`).join(", ");
    const values = [...inputKeys.map((k) => patched[k]), item_id];

    await pool.query("UPDATE items SET " + columnName +
        " WHERE id = $" + (values.length).toString(),
        values
    );
    
    res.status(StatusCodes.OK).json({ msg: "Changes saved successfully", patched: inputKeys });
}

const uploadImages = async (req, res) => {

    req.fileCount--;
    const item_id = req.params.id;
    const files = req.files;
    const existingCount = req.currentItemImgCount;
    if (!files) {
        throw new CustomAPIError("No item_images uploaded", StatusCodes.BAD_REQUEST);
    }

    let imgIndex = []
    for (let i = 0; i < files.length; i++) {
        const { rows: img } = await pool.query(
            "INSERT INTO item_images (item_id, name, url, order_idx) VALUES ($1, $2, $3, $4) RETURNING id",
            [item_id, files[i].originalname, files[i].path, existingCount + i]
        );
        imgIndex.push(img.id);
    }

    await pool.query("UPDATE items SET image_count = $1 WHERE id = $2",
        [existingCount + files.length, item_id]
    );

    res.status(StatusCodes.CREATED).json({
        msg: `${req.fileCount} images uploaded`,
        fileCount: req.fileCount,
        fileNames: files.map((file) => file.originalname),
        recentImgIndexes: imgIndex
    });

}

const deleteImage = async (req, res) => {

    const { id: item_id, image_id } = req.params;
    
    const { rowCount, rows: del_imgs } = await pool.query("DELETE FROM item_images WHERE id = $1 AND item_id = $2 RETURNING url",
        [image_id, item_id]
    );
    if (rowCount === 0) {
        throw new CustomAPIError(`No image with id: ${image_id} found in item with id: ${item_id}`, StatusCodes.BAD_REQUEST);
    }
    fs.unlink(path.join(__dirname, "../", del_imgs[0].url), (err) => {
        if (err) console.error(err);
    });

    const { rowCount: imgCount, rows: images } = await pool.query("SELECT id FROM item_images WHERE item_id = $1 ORDER BY order_idx",
        [item_id]
    );

    for (let i = 0; i < imgCount; i++) {
        await pool.query("UPDATE item_images SET order_idx = $1 WHERE id = $2",
            [i, images[i].id]
        );
    }

    await pool.query("UPDATE items SET image_count = $1 WHERE id = $2",
        [imgCount, item_id]
    );

    res.status(StatusCodes.OK).json({ msg: "Item image deleted successfully" });
}

const reorderImages = async (req, res) => {

    const item_id = req.params.id;

    const newOrderArray = req.body.new_img_order;

    const { rows: [ {image_count: imgCount} ] } = await pool.query(
        "SELECT image_count FROM items WHERE id = $1",
        [item_id]
    );

    if (!newOrderArray) {
        throw new CustomAPIError("\"new_img_order\" field missing", StatusCodes.BAD_REQUEST);
    }
    const { error } = itemImageReorderSchema.length(imgCount).validate(newOrderArray);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        
        await client.query(
            "UPDATE item_images SET order_idx = ~order_idx WHERE item_id = $1 RETURNING id",
            [item_id]
        );
        
        for (let i = 0; i < newOrderArray.length; i++) {
            const { rowCount } = await client.query(
                "UPDATE item_images SET order_idx = $1 WHERE item_id = $2 AND id = $3",
                [i, item_id, newOrderArray[i]]
            );
            if (rowCount === 0) {
                throw new CustomAPIError(
                    `No image found with id: ${newOrderArray[i]} in item with id: ${item_id}`,
                    StatusCodes.NOT_FOUND);
            }
        }

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }

    res.status(StatusCodes.OK).json({ msg: "Item images re-ordered successfully" });

}

module.exports = {
    getItem, getItems, postItem, deleteItem, editItem,
    uploadImages, deleteImage, reorderImages
}
