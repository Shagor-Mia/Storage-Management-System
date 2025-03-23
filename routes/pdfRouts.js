const express = require("express");
const authProtect = require("../middlewares/auth");
const {
  getAllPdfByDate,
  getSizeOfPdf,
  toggleFavouritePdf,
  getAllFavouritePdf,
  getTotalNumberPdfs,
  getAllPdfs,
  renamePdf,
  duplicatePdf,
  copyPdf,
  deletePdf,
  getPdfFile,
  getPdf,
  uploadPdf,
  getTotalSizeOfAllPdfs,
} = require("../controllers/pdfControllers");
const pdfRouter = express.Router();

pdfRouter.post("/upload", authProtect, uploadPdf);
pdfRouter.get("get/:id", authProtect, getPdf);
pdfRouter.get("/file/:id", authProtect, getPdfFile);
pdfRouter.delete("/delete/:id", authProtect, deletePdf);
pdfRouter.post("/copy/:id", authProtect, copyPdf);
pdfRouter.post("/duplicate/:id", authProtect, duplicatePdf);
pdfRouter.put("/rename/:id", authProtect, renamePdf);
pdfRouter.get("/get-all", authProtect, getAllPdfs);
pdfRouter.get("/total/count", authProtect, getTotalNumberPdfs);
pdfRouter.get("/total/size", authProtect, getTotalSizeOfAllPdfs);

pdfRouter.get("/all/favorites", authProtect, getAllFavouritePdf);
pdfRouter.put("/favorite/:id", authProtect, toggleFavouritePdf);
pdfRouter.get("/size/:id", authProtect, getSizeOfPdf);
pdfRouter.get("/date/:date", authProtect, getAllPdfByDate);

module.exports = pdfRouter;
