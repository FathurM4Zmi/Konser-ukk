import { validationResult } from "express-validator";
import { HttpError } from "../utils/http.js";

/** Ubah hasil express-validator menjadi response 422 yang rapi. */
export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const err of result.array()) {
    if (!errors[err.path]) errors[err.path] = err.msg;
  }
  next(new HttpError(422, "Data yang dikirim belum valid.", errors));
};
