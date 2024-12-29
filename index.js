const express = require("express");
const dbInfo = require("../database/configdata");
const mysql = require("mysql2");
const bodyparser = require("body-parser");
const checkRegisterNumber = require('../generalfnc'); 
const app = express();
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended:true}));
const session = require("express-session");

app.use(session({
	secret:"myVerySecretKey", 
	saveUninitiliazed: true, 
	resave: true}));

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});


const weatherRouter = require("/routes/weatherRouter");
app.use("/weather", weatherRouter);

// const autoRouter = require("../routes/autoRoute");
// app.use('/vp24',autoRouter);

app.get("/", (req,res)=>{
	res.render("index");
});
app.post("/", (req,res)=>{
	if (err) {
		throw err;
	} else {
		res.render("index");
	}
});

app.get("/autosisenemine", (req,res)=>{
	let notice = "";
	let registerNumber = req.body.registerNumberInput;
	let weightIn = req.body.weightInInput;
	res.render("autosisenemine", {notice:notice, registernumber: registerNumber, weightin: weightIn});
});

app.post("/autosisenemine", checkRegisterNumber, (req,res)=>{
	let notice = "";
	let registerNumber = req.body.registerNumberInput;
	let weightIn = req.body.weightInInput;
	if(!registerNumber || !weightIn){
		notice = "Osa andmeid on puudu";
		res.render("autosisenemine", {notice:notice});
	} else {
		if(req.RegisterNumberExists){
			notice = "Selline number on juba olemas. Võib minna kohe 'Autoväljumise' lehele";
			res.render("autosisenemine", {notice: notice})
		} else {
			let sqlReq = "INSERT into vp2_2024_viljavedu (register_number, weight_in) VALUES (?,?)"
			conn.execute(sqlReq, [registerNumber, weightIn],(err,sqlRes)=>{
			if (err) {
				notice = "Tehnilistel pohjustel andmeid ei salvestati";
				console.log({notice: notice,registernumber: registerNumber, weightin: weightIn});
				res.render("autosisenemine", {notice: notice,registernumber: registerNumber, weightin: weightIn});
				throw err;
			} else {
				console.log("Andmed on salvestatud");
				res.redirect("/autovaljumine");
				
			}
		});
		}
	}
});
	


app.get("/autovaljumine",(req,res)=>{
	let notice = "";
	let registerNumber = req.body.registerNumberInput;
	let weightOut = req.body.weightOutInput;
	const mySession  = req.session
	console.log(mySession);
	res.render("autovaljumine", {notice:notice, registernumber: registerNumber, weightout: weightOut});
});

app.post("/autovaljumine",checkRegisterNumber, (req,res)=>{
	let notice = "";
	let weightOut = req.body.weightOutInput;
	let registerNumber = req.body.registerNumberInput;
	if (!weightOut || !registerNumber) {
        notice = "Osa andmeid on puudu";
        res.render("autovaljumine", {notice});
	}
	let sqlReq = "UPDATE vp2_2024_viljavedu SET weight_out = ? WHERE register_number = ?";
	conn.execute(sqlReq, [weightOut, registerNumber,],(err,sqlRes) =>{
	if (err){
			notice = "Tehnilistel pohjustel andmeid ei salvestanud";
			res.render("autovaljumine", {notice: notice,registernumber: registerNumber, weightOut: weightOut});
	} else {
			req.session.mySession = registerNumber;
			console.log("Andmed on salvestatud");
			return res.redirect("/kokkuvotte");
		}
	});
});

app.get("/kokkuvotte",(req,res)=>{
	let registernumber = req.session.mySession;
	let notice = "";
	let sqlReq = "SELECT weight_in, weight_out  FROM vp2_2024_viljavedu WHERE register_number=?";
	conn.execute(sqlReq, [registernumber],(err,sqlRes) =>{
	if (err){
		notice = "Tehnilistel pohjustel andmeid ei saanud";
		res.render("kokkuvotte", {notice: notice});
	} else {
		let weightIN = sqlRes[0].weight_in;
        let weightOut = sqlRes[0].weight_out;
	let sumSqlReq = "SELECT SUM(weight_in) AS totalWeightIn, SUM(weight_out) AS totalWeightOut FROM vp2_2024_viljavedu WHERE weight_out IS NOT NULL";
	conn.execute(sumSqlReq,[],(err,sumsqlRes) =>{
		if(err){
			notice = "Tehnilistel pohjustel andmeid ei saanud";
			res.render("kokkuvotte", {notice: notice});
		} else {
			let totalWeightIn = sumsqlRes[0].totalWeightIn;
			let totalWeightOut = sumsqlRes[0].totalWeightOut;
			console.log("Sessioon lõppes.")
			console.log({registernumber: registernumber ,weightin: weightIN, weightout: weightOut, totalWeightIn: totalWeightIn, totalWeightOut: totalWeightOut})
			res.render("kokkuvotte", {registernumber: registernumber ,weightin: weightIN, weightout: weightOut, totalWeightIn: totalWeightIn, totalWeightOut: totalWeightOut});
		}
	});
	}
});
});




app.listen(8800);