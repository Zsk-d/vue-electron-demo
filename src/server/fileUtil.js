const fs = require("fs");
var path = require('path')

const readJsonFileSync = (filePath) => {
  let res = null;
  try {
    let data = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });
    res = JSON.parse(data);
  } catch (error) {}
  return res;
};
const withoutCws = (key,value)=>{
  if(key == 'cws'){
    return undefined;
  }else{
    return value;
  }
};
const writeJsonFileSync = (filePath, obj) => {
  let str = JSON.stringify(obj,withoutCws);
  if(!fs.existsSync(path.dirname(filePath))){
    fs.mkdirSync(path.dirname(filePath));
  }
  fs.writeFileSync(filePath, str);
};

module.exports = { readJsonFileSync, writeJsonFileSync };
