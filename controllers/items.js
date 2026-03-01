// require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");
const supabase = require("../utils/supabase");
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

    const { page = "1", search, type = "sell,lend", item_category, closed = "false",
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
    if (price !== undefined && price !== null)
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

    if (!files || files.length === 0) {
        throw new CustomAPIError("No item_images uploaded", StatusCodes.BAD_REQUEST);
    }

    const client = await pool.connect();
    const uploadedFiles = [];

    try {
        await client.query("BEGIN");

        // Lock item row
        const { rows: [item] } = await client.query(
            "SELECT image_count FROM items WHERE id = $1 FOR UPDATE",
            [item_id]
        );

        if (!item) {
            throw new CustomAPIError("Item not found", StatusCodes.NOT_FOUND);
        }

        const maxAllowed = 5;

        if (item.image_count + files.length > maxAllowed) {
            throw new CustomAPIError("Image limit reached", StatusCodes.BAD_REQUEST);
        }

        for (let i = 0; i < files.length; i++) {

            const fileName = `${item_id}-${Date.now()}-${i}`;

            const { error } = await supabase.storage
                .from("item_images")
                .upload(fileName, files[i].buffer, {
                    contentType: files[i].mimetype,
                });

            if (error) throw error;

            const publicUrl = `${process.env.STORAGE_URL}/storage/v1/object/public/item_images/${fileName}`;

            uploadedFiles.push(fileName);

            await client.query(
                `INSERT INTO item_images 
                 (item_id, name, url, order_idx)
                 VALUES ($1,$2,$3,$4)`,
                [
                    item_id,
                    files[i].originalname,
                    publicUrl,
                    item.image_count + i
                ]
            );
        }

        await client.query(
            "UPDATE items SET image_count = $1 WHERE id = $2",
            [item.image_count + files.length, item_id]
        );

        await client.query("COMMIT");

        res.status(StatusCodes.CREATED).json({
            msg: "Images uploaded successfully",
            count: files.length
        });

    } catch (err) {

        await client.query("ROLLBACK");

        if (uploadedFiles.length > 0) {
            await supabase.storage
                .from("item_images")
                .remove(uploadedFiles);
        }

        throw err;

    } finally {
        client.release();
    }

}

const deleteImage = async (req, res) => {
    const { id: item_id, image_id } = req.params;

    const client = await pool.connect();
    let deletedFileName = null;

    try {
        await client.query("BEGIN");

        // Lock item row
        const { rows: [item] } = await client.query(
            "SELECT image_count FROM items WHERE id = $1 FOR UPDATE",
            [item_id]
        );

        if (!item) {
            throw new CustomAPIError("Item not found", StatusCodes.NOT_FOUND);
        }

        // Delete image and get URL
        const { rowCount, rows } = await client.query(
            `DELETE FROM item_images 
             WHERE id = $1 AND item_id = $2 
             RETURNING url`,
            [image_id, item_id]
        );

        if (rowCount === 0) {
            throw new CustomAPIError(
                `No image with id ${image_id} found`,
                StatusCodes.NOT_FOUND
            );
        }

        const deletedUrl = rows[0].url;
        deletedFileName = deletedUrl.split("/").pop();

        // Reorder remaining images (single query, no loop)
        await client.query(
            `
            WITH reordered AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY order_idx) - 1 AS new_idx
                FROM item_images
                WHERE item_id = $1
            )
            UPDATE item_images i
            SET order_idx = r.new_idx
            FROM reordered r
            WHERE i.id = r.id
            `,
            [item_id]
        );

        // Update item image_count
        await client.query(
            "UPDATE items SET image_count = image_count - 1 WHERE id = $1",
            [item_id]
        );

        await client.query("COMMIT");

        // Delete from Supabase storage AFTER commit
        if (deletedFileName) {
            await supabase.storage
                .from("item_images")
                .remove([deletedFileName]);
        }

        res.status(StatusCodes.OK).json({
            msg: "Item image deleted successfully"
        });

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

const reorderImages = async (req, res) => {
    
    const item_id = req.params.id;
    const newOrderArray = req.body.new_img_order;

    if (!Array.isArray(newOrderArray)) {
        throw new CustomAPIError(
            `"new_img_order" must be an array`,
            StatusCodes.BAD_REQUEST
        );
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Lock item row
        const { rows: [item] } = await client.query(
            "SELECT image_count FROM items WHERE id = $1 FOR UPDATE",
            [item_id]
        );

        if (!item) {
            throw new CustomAPIError("Item not found", StatusCodes.NOT_FOUND);
        }

        if (newOrderArray.length !== item.image_count) {
            throw new CustomAPIError(
                "Invalid reorder array length",
                StatusCodes.BAD_REQUEST
            );
        }

        // Validate all IDs belong to item
        const { rows: existingImages } = await client.query(
            "SELECT id FROM item_images WHERE item_id = $1",
            [item_id]
        );

        const existingIds = new Set(existingImages.map(i => i.id));

        for (const id of newOrderArray) {
            if (!existingIds.has(id)) {
                throw new CustomAPIError(
                    `Image ${id} does not belong to item`,
                    StatusCodes.BAD_REQUEST
                );
            }
        }

        // Temporary negative shift to avoid unique conflicts
        await client.query(
            "UPDATE item_images SET order_idx = -order_idx - 1 WHERE item_id = $1",
            [item_id]
        );

        for (let i = 0; i < newOrderArray.length; i++) {
            await client.query(
                `UPDATE item_images 
                 SET order_idx = $1 
                 WHERE id = $2 AND item_id = $3`,
                [i, newOrderArray[i], item_id]
            );
        }

        await client.query("COMMIT");

        res.status(StatusCodes.OK).json({
            msg: "Item images reordered successfully"
        });

    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

module.exports = {
    getItem, getItems, postItem, deleteItem, editItem,
    uploadImages, deleteImage, reorderImages
}
