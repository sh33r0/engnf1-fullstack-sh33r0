const express = require("express");
const Resource = require("../models/Resource");
const { auth, admin } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const { search, type, minCapacity } = req.query;

    const page = Number(req.query.page || 1);
    const limit = 10;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid page",
        },
      });
    }

    const types = ["ROOM", "LAB", "EQUIPMENT"];

    if (type && !types.includes(type)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid resource type",
        },
      });
    }

    if (
      minCapacity !== undefined &&
      (!/^\d+$/.test(minCapacity) ||
        Number(minCapacity) < 1 ||
        Number(minCapacity) > 500)
    ) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid minimum capacity",
        },
      });
    }

    if (search && (typeof search !== "string" || search.length > 100)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid search",
        },
      });
    }

    const filter = {};

    if (req.user.role !== "ADMIN") {
      filter.isActive = true;
    }

    if (type) filter.type = type;

    if (minCapacity) {
      filter.capacity = { $gte: Number(minCapacity) };
    }

    if (search) {
      const q = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: q, $options: "i" };
    }

    const total = await Resource.countDocuments(filter);

    const data = await Resource.find(filter)
      .sort({ nameLower: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      data,
      page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch resources",
      },
    });
  }
});


router.post("/", auth, admin, async (req, res) => {
    try {
        const { name, type, capacity, description } = req.body;

        if (
            typeof name !== "string" ||
            name.trim().length < 3 ||
            name.trim().length > 60 ||
            !["ROOM", "LAB", "EQUIPMENT"].includes(type) ||
            !Number.isInteger(capacity) ||
            capacity < 1 ||
            capacity > 500 ||
            (description !== undefined &&
                (typeof description !== "string" || description.length > 300))
        ) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Invalid resource details"
                }
            });
        }

        const exists = await Resource.findOne({
            nameLower: name.trim().toLowerCase()
        });

        if (exists) {
            return res.status(409).json({
                error: {
                    code: "CONFLICT",
                    message: "Resource name already exists"
                }
            });
        }

        const resource = await Resource.create({
            name: name.trim(),
            type,
            capacity,
            description: description?.trim() || ""
        });

        res.status(201).json({ resource });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                error: {
                    code: "CONFLICT",
                    message: "Resource name already exists"
                }
            });
        }

        console.log(err);
        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to create resource"
            }
        });
    }
});

module.exports = router;
