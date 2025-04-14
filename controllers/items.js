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

    const { rowCount, rows: items } = await pool.query(`
        SELECT
            i.id,
            i.item_name,
            i.title,
            i.item_category,
            LEFT(i.description, 64) AS description,
            i.price,
            i.type,
            i.closed,
            i.created_at,
            CASE
                WHEN img.id IS NULL THEN NULL
                ELSE JSON_BUILD_OBJECT(
                    'id', img.id,
                    'name', img.name,
                    'url', img.url
                )
            END AS cover_img
        FROM items i
        LEFT JOIN item_images img ON i.id = img.item_id
        WHERE (img.order_idx = 0 OR img.order_idx IS NULL) AND NOT closed
        `);

    res.status(StatusCodes.OK).json({ itemCount: rowCount, items });

}

const postItem = async (req, res) => {
    
    const { error } = validateItemPostInfoRequired(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { userId } = req.user;
    const { item_name, item_category, title, description, location, price, type } = req.body;
    
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

    const { error } = validateItemPostInfo(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { item_name, item_category, title, description, location, price, closed } = req.body;

    const { rowCount, rows: [ { type } ] } = await pool.query("SELECT type FROM items WHERE id = $1",
        [item_id]
    );
    if (rowCount === 0) {
        throw new CustomAPIError(`No item post with id: ${item_id} found`, StatusCodes.NOT_FOUND);
    }

    const priceSchemaTT = (type === "sell" || type === "lend") ? priceSchema.optional() : priceSchema.forbidden();
    const { error: error2 } = priceSchemaTT.validate(price);
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

    const item_id = req.params.id;
    const files = req.files;
    const existingCount = req.currentItemImgCount;
    if (!files) {
        throw new CustomAPIError("No item_images uploaded", StatusCodes.BAD_REQUEST);
    }

    for (let i = 0; i < files.length; i++) {
        await pool.query(
            "INSERT INTO item_images (item_id, name, url, order_idx) VALUES ($1, $2, $3, $4)",
            [item_id, files[i].originalname, files[i].path, existingCount + i]
        );
    }

    await pool.query("UPDATE items SET image_count = $1 WHERE id = $2",
        [existingCount + files.length, item_id]
    );

    res.status(StatusCodes.CREATED).json({
        msg: `${req.fileCount} images uploaded`,
        fileCount: req.fileCount,
        fileNames: files.map((file) => file.originalname)
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
