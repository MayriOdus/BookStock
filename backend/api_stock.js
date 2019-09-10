const express = require("express")
const router = express.Router();
const product = require("./models/product");
const Sequelize = require("sequelize");
const constants = require("./constant");
const formidable = require("formidable");// file and data ::separate from each other
const path = require("path");//
const fs = require('fs-extra');//,move file
const Op = Sequelize.Op;



////////////////////// Upload Image /////////////////////

uploadImage = async (files, doc) => {
    if (files.image != null) {
        var fileExtention = files.image.name.split(".")[1];
        doc.image = `${doc.id}.${fileExtention}`;
        var newpath =
            path.resolve(__dirname + "/uploaded/images/") + "/" + doc.image;
        if (fs.exists(newpath)) {
            await fs.remove(newpath);
        }
        await fs.moveSync(files.image.path, newpath);

        // Update database
        let result = product.update(
            { image: doc.image },
            { where: { id: doc.id } }
        );
        return result;
    }
};


router.get("/product", async (req, res) => {

    let result = await product.findAll({ order: Sequelize.literal("id DESC") });
    res.json(result);
})

////////////////////////////Add product/////////////////////////
router.post("/product", async (req, res) => {
    try {
        const form = new formidable.IncomingForm();
        form.parse(req, async (error, fields, files) => {
            let result = await product.create(fields);
            result = await uploadImage(files, result);
            res.json({
                result: constants.kResultOk,
                message: JSON.stringify(result)
            });
        })
    } catch (error) {
        res.json({ result: constants.kResultNotOk, message: JSON.stringify(error) });
    }

})

//////////////// UPDATE ////////////////
router.put("/product", async (req, res) => {
    try {
        var form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            let result = await product.update(fields, { where: { id: fields.id } });
            result = await uploadImage(files, fields);

            res.json({
                result: constants.kResultOk,
                message: JSON.stringify(result)
            });
        });
    } catch (err) {
        res.json({ result: constants.kResultNotOk, message: JSON.stringify(err) });
    }
})
/////////////////////GET////////////////
router.get("/product/:id", async (req, res) => {
    try {
        let result = await product.findOne({ where: { id: req.params.id } });
        if (result) {
            res.json(result)
        } else {
            res.json({});
        }
    } catch (error) {
        res.json({});
    }


})

// Get Products by Keyword
router.get("/product/keyword/:keyword", async (req, res) => {
    const { keyword } = req.params;
    let result = await product.findAll({ where: { name: { [Op.like]: `%${keyword}%` } } });
    res.json(result);
});
router.delete("/product/:id", async (req, res)=>{
    try{
      const {id} = req.params
      const result = await product.findOne({where: {id}})
      await fs.remove(__dirname + "/uploaded/images/" + result.image)
      result = await product.destroy({ where: { id: id } });
      res.json({ result: constants.kResultOk, message: JSON.stringify(result) });
    }catch(err){
      res.json({ result: constants.kResultNotOk, message: JSON.stringify(err) });
    }
  })
        
    



module.exports = router;