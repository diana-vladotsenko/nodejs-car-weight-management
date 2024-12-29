const dbInfo = require("./database/configdata");
const mysql = require("mysql2");
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

function checkRegisterNumber (req,res,next) {
	let registerNumber = req.body.registerNumberInput;
	let notice = "";
	if (!registerNumber) {
        notice = "Registreerimisnumber on puudu.";
        res.render({ notice : notice});
    }
	let sqlReq = "SELECT * FROM vp2_2024_viljavedu WHERE register_number = ?";
	conn.execute(sqlReq,[registerNumber],(err,sqlRes)=>{
		if (err) {
			notice = "Tehnilistel pohjustel andmeid ei saanud";
			res.render({notice:notice});
		}
		if(sqlRes.length > 0) {
			req.RegisterNumberExists = true;
            console.log("Registri number olemas");
            next();
        } else {
			req.RegisterNumberExists = false;
			notice = "Sellist registrinumbrid pole";
			next();
		}
	});
};

module.exports = checkRegisterNumber; 