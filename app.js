//test covid india
const path = require("path");
const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};
initializeDBAndServer();

//Changing case of get all states list
const stateListCaseConvertToCamel = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};

const getDistrictAPICaseChange = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

//GET states API1

app.get("/states/", async (request, response) => {
  const searchStatesQuery = `SELECT * FROM state ORDER BY state_id;`;
  const statesList = await db.all(searchStatesQuery);
  response.send(statesList.map((each) => stateListCaseConvertToCamel(each)));
});

//GET state by stateID API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const searchStatesQuery = `SELECT * FROM state WHERE state_id=${stateId};`;
  const stateList = await db.get(searchStatesQuery);
  response.send(stateListCaseConvertToCamel(stateList));
});

//Adding a district in the district table API3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const insertQuery = `INSERT INTO 
  district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths});`;
  const dbResponse = await db.run(insertQuery);

  response.send("District Successfully Added");
});

//Get district based on district_id API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT * FROM district WHERE district_id=${districtId}`;
  const districtResult = await db.get(getDistrict);
  response.send(getDistrictAPICaseChange(districtResult));
});

//DELETE district based on district_id API5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district 
    WHERE district_id=${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//UPDATE district details based on district_id API6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district SET district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get state statistics API7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths FROM district
    WHERE state_id=${stateId}`;
  const dbResponse = await db.get(getStatsQuery);
  response.send(dbResponse);
});

//GET state name based on districtId API8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateQuery = `SELECT state_name as stateName FROM state
    INNER JOIN district ON state.state_id=district.state_id
    WHERE district.district_id=${districtId}`;
  const stateName = await db.get(getStateQuery);
  response.send(stateName);
});
module.exports = app;
