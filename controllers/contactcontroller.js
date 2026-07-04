const contactModel = require("../models/contactmodel");

const getMessages = async (_req, res, next) => {
  try {
    const data = await contactModel.getMessages();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const createMessage = async (req, res, next) => {
  try {
    const data = await contactModel.createMessage(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMessages,
  createMessage,
};