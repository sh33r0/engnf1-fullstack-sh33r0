const mongoose = require("mongoose");
const TicketEvent = require("../models/TicketEvent");
const User = require("../models/User");
const express = require("express");
const Ticket = require("../models/Ticket");
const { auth, admin } = require("../middleware/auth");
const router = express.Router();

const classify = (s, b) => {
  const t = `${s} ${b}`.toLowerCase();

  let category = "FEATURE_REQUEST";
  if (["refund", "invoice", "charge", "payment"].some((x) => t.includes(x))) {
    category = "BILLING";
  } else if (
    ["password", "2fa", "sign in", "locked out", "login"].some((x) =>
      t.includes(x),
    )
  ) {
    category = "LOGIN";
  } else if (
    ["package", "arrived", "shipping", "tracking", "delivery"].some((x) =>
      t.includes(x),
    )
  ) {
    category = "DELIVERY";
  } else if (
    ["crash", "error", "500", "exception", "broken"].some((x) => t.includes(x))
  ) {
    category = "BUG";
  }

  let priority = "MEDIUM";

  if (["urgent", "production down", "locked out"].some((x) => t.includes(x))) {
    priority = "URGENT";
  } else if (["error", "refund", "not arrived"].some((x) => t.includes(x))) {
    priority = "HIGH";
  }

  return { category, priority };
};

router.post("/import", auth, admin, async (req, res) => {
  try {
    const { tickets } = req.body;
    if (!tickets || !Array.isArray(tickets)) {
      return res
        .status(400)
        .json({
          code: "INVALID_TICKETS_DATA",
          message: "Invalid tickets data",
        });
    }

    let importedCount = 0;
    let updatedCount = 0;
    let skippedOverrideCount = 0;

    for (const t of tickets) {
      if (
        !t ||
        typeof t.subject !== "string" ||
        typeof t.body !== "string" ||
        typeof t.externalId !== "string" ||
        t.externalId.trim().length === 0 ||
        t.subject.trim().length < 3 ||
        t.subject.trim().length > 150 ||
        t.body.trim().length < 5 ||
        t.body.trim().length > 2000
      ) {
        return res.status(400).json({
          error: {
            code: "INVALID_TICKET_DATA",
            message: "Invalid ticket data",
          },
        });
      }
    }
    for (const t of tickets) {
      const externalId = t.externalId.trim();
      const subject = t.subject.trim();
      const body = t.body.trim();
      const result = classify(subject, body);

      const old = await Ticket.findOne({ externalId });

      if (!old) {
        await Ticket.create({
          externalId,
          subject,
          body,
          autoCategory: result.category,
          category: result.category,
          priority: result.priority,
        });
        importedCount++;
      } else {
        old.subject = subject;
        old.body = body;

        if (!old.isHumanOverride) {
          old.category = result.category;
          old.priority = result.priority;
        } else {
          skippedOverrideCount++;
        }
        await old.save();
        updatedCount++;
      }
    }
    return res.status(200).json({
      importedCount,
      updatedCount,
      skippedOverrideCount,
      total: tickets.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Ticket import failed",
      },
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const { status, category, priority, q } = req.query;
    const enums = {
      status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      category: ["BILLING", "LOGIN", "DELIVERY", "BUG", "FEATURE_REQUEST"],
      priority: ["URGENT", "HIGH", "MEDIUM", "LOW"],
    };

    for (const key of ["status", "category", "priority"]) {
      if (req.query[key] && !enums[key].includes(req.query[key])) {
        return res.status(400).json({
          error: {
            code: "INVALID_QUERY_PARAM",
            message: `Invalid query parameter: ${key}`,
          },
        });
      }
    }

    if (q !== undefined && (typeof q !== "string" || q.length > 200)) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY_PARAM",
          message: "Invalid query parameter: q",
        },
      });
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        error: {
          code: "INVALID_QUERY_PARAM",
          message: "Invalid query parameter: page or limit",
        },
      });
    }

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { subject: { $regex: safe, $options: "i" } },
        { body: { $regex: safe, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      Ticket.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Ticket.countDocuments(filter),
    ]);

    return res.status(200).json({
      data,
      page,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch tickets",
      },
    });
  }
});

router.patch("/:id", auth, async (req, res) => {
    const allowed = ["category", "priority", "status", "assigneeId"];
    const keys = Object.keys(req.body || {});

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            error: {
                code: "NOT_FOUND",
                message: "Ticket not found"
            }
        });
    }

    if (!keys.length || keys.some(k => !allowed.includes(k))) {
        return res.status(400).json({
            error: {
                code: "INVALID_INPUT",
                message: "Invalid update fields"
            }
        });
    }

    const enums = {
        category: ["BILLING", "LOGIN", "DELIVERY", "BUG", "FEATURE_REQUEST"],
        priority: ["URGENT", "HIGH", "MEDIUM", "LOW"],
        status: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
    };

    for (const k of keys) {
        if (k === "assigneeId") {
            if (req.body[k] !== null && !mongoose.Types.ObjectId.isValid(req.body[k])) {
                return res.status(400).json({
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Invalid assignee ID"
                    }
                });
            }
        } else if (!enums[k].includes(req.body[k])) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: `Invalid value for ${k}`
                }
            });
        }
    }
    

    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const ticket = await Ticket.findById(req.params.id).session(session);
        if(!ticket){
            await session.abortTransaction();
            return res.status(404).json({
                error: {
                    code: "NOT_FOUND",
                    message: "Ticket not found"
                }
            });
        }
        if(req.body.assigneeId && !(await User.findById(req.body.assigneeId).session(session))){
            await session.abortTransaction();
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Assignee not found"
                }
            });
        }

        const events = [];
        const actor = req.get("X-User-Id")?.trim() || req.user.email;

        for(const k of keys){
            const oldVal= ticket[k]== null ? null : ticket[k].toString();
            const newVal = req.body[k] === null ? null : req.body[k].toString();
            if(oldVal === newVal) continue;
            events.push({
                ticketId: ticket._id,
                field: k,
                oldValue: oldVal,
                newValue: newVal,
                actor
            });
            ticket[k] = req.body[k];
            if(k=="category"){
                ticket.isHumanOverride = true;
                ticket.isReviewed = true;
            }

            if(k === "status" && oldVal === "OPEN"){
                ticket.isReviewed = true;
            }
        }
        await ticket.save({session});

        if(events.length){
            await TicketEvent.insertMany(events, {session});
        }
        await session.commitTransaction();

        res.json({
            message: "Ticket updated successfully",
            ticket
        });
    } catch(err){
        await session.abortTransaction();

        if(err.name === "ValidationError"){
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: err.message
                }
            });
        }
        res.status(500).json({
            error: {
                code: "INTERNAL_ERROR",
                message: "Failed to update ticket"
            }
        });
    }finally{
        await session.endSession();
    }
});

router.get("/:id", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Ticket not found" }
    });
  }

  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ticket not found" }
      });
    }

    const events = await TicketEvent.find({ ticketId: ticket._id })
      .sort({ createdAt: -1 });

    res.json({ ticket, events });
  } catch (err) {
    res.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "Unable to fetch ticket" }
    });
  }
});


module.exports = router;
