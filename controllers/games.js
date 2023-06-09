import HttpError from "../helpers/HttpError.js";
import ctrlWrapper from "../helpers/ctrlWrapper.js";
import { Game } from "../models/game.js";

const getGames = async (req, res) => {
  const { _id: owner } = req.user;
  const { page = 1, limit = 6 } = req.query;
  const skip = (page - 1) * limit;
  const filter = {
    owners: owner,
  };

  const totalGames = await Game.countDocuments(filter);
  const contactList = await Game.find(filter, "-createdAt -updatedAt", {
    skip,
    limit,
  });
  res.json({ games: contactList, totalPages: Math.ceil(totalGames / limit) });
};

const getGameById = async (req, res) => {
  const { gameID } = req.params;
  const { _id } = req.user;
  const game = await Game.findOne({ gameID });
  if (!game || !game.owners.includes(_id))
    throw HttpError(404, "Game not found");
  const { name, backdrop, rating } = game;
  res.json({ gameID, name, backdrop, rating });
};

const updateOwner = async (req, res) => {
  const { gameID } = req.params;
  const { _id: userID } = req.user;
  const game = await Game.findOne({ gameID });
  if (!game) throw HttpError(404, "Game not found");
  const newOwners = game.owners.filter((game) => !game.equals(userID));
  await Game.findByIdAndUpdate(game._id, { owners: newOwners });
  res.json({ Message: "Game removed", gameID });
};

const addGame = async (req, res) => {
  const { _id: owner } = req.user;
  const { gameID } = req.body;
  const game = await Game.findOne({ gameID });
  if (game) {
    if (game.owners.includes(owner)) {
      throw HttpError(409, "The user already owns this game");
    }
    await Game.findOneAndUpdate(game._id, { owners: [...game.owners, owner] });
    res.status(201).json(req.body);
  } else {
    await Game.create({ ...req.body, owners: [owner] });
    res.status(201).json(req.body);
  }
};

export const getGamesCtrl = ctrlWrapper(getGames);
export const getGameByIdCtrl = ctrlWrapper(getGameById);
export const updateOwnerCtrl = ctrlWrapper(updateOwner);
export const addGameCtrl = ctrlWrapper(addGame);
